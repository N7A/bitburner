import * as Log from 'workspace/socle/utils/logging';
import { Info } from 'workspace/socle/interface/info';
import { GameRepository } from 'workspace/game/domain/game.repository';

/** @param {NS} ns */
export async function main(ns: NS) {
    const info: PlayerInfo = new PlayerInfo(ns);

    info.run();
}

class PlayerInfo extends Info {
	private gameRepository: GameRepository;

	constructor(ns: NS) {
        super(ns, 'Self');

		this.gameRepository = new GameRepository(ns);
	}

    printData() {
		let player = this.ns.getPlayer();
		
		this.getMessages(player)
			.forEach(message => this.logger.log(message));
	}

	getMessages(data: Player): string[] {
		return [
			...this.showPlayerStats(data),
			'\n',
			...this.showProductionInfo(),
			'\n',
			...this.showServeurs(),
			'\n',
			...this.showFactionsData(data),
			'\n',
			...this.showScriptFeatures(),
			'\n',
			...this.showResetInfo(),
			'\n',
			...this.showBitnode()
		]
	}

	showPlayerStats(data: Player): string[] {
		let hackingLevel = this.ns.getHackingLevel();
		return [
			Log.INFO("Hacking Level", hackingLevel),
			//Log.INFO("Entropy", player.entropy)
			Log.INFO("People Killed", data.numPeopleKilled),
			Log.INFO("Karma", this.ns.heart.break().toFixed(2))
		]
	}

	showProductionInfo(): string[] {
		// get current node number
		const numNodes = this.ns.hacknet.numNodes();
		let hacknetProduction: number = 0;
		for (let i = 0; i < numNodes; i++) {
			hacknetProduction += this.ns.hacknet.getNodeStats(i).production;
		}

		return [
			Log.title("Production"),
			Log.INFO("Current script production", Log.money(this.ns, this.ns.getTotalScriptIncome()[0]), '/s'),
			Log.INFO("Current Hacknet production", Log.money(this.ns, hacknetProduction), '/s'),
			Log.INFO("Script production augmentation since augmentation", Log.money(this.ns, this.ns.getTotalScriptIncome()[1]), '/s')
		]
	}

	showServeurs(): string[] {
		let message: string[] = [
			Log.title("Server"),
			Log.color("Home", Log.Color.MAGENTA),
			Log.INFO("Used RAM", this.ns.formatNumber(this.ns.getServer().ramUsed) + '/' + this.ns.formatNumber(this.ns.getServer().maxRam)),
			'\n',
			Log.color("Servers owned", Log.Color.CYAN), ` (${Log.color(this.ns.getPurchasedServers().length.toString(), Log.Color.CYAN)})`
		]
		for (const owned of this.ns.getPurchasedServers()) {
			message.push(Log.color(owned, Log.Color.YELLOW));
			message.push(Log.INFO("Used RAM", this.ns.formatNumber(this.ns.getServer(owned).ramUsed) + 
			'/' + this.ns.formatNumber(this.ns.getServer(owned).maxRam)));
		}
		return message;
	}
	
	showFactionsData(data: Player): string[] {
		return [
			Log.title("Faction"),
			Log.INFO(`Factions (${Log.color(data.factions.length.toString(), Log.Color.CYAN)})`, `${data.factions}`),
			Log.INFO("Share Power", this.ns.getSharePower())
		]
	}

	showScriptFeatures(): string[] {
		return [
			Log.title("Script features"),
			Log.INFO('Formulas API', this.gameRepository.getData().hasFormulas),
			Log.INFO("Singularity API", this.gameRepository.getData().hasSingularity)
		]
	}

	showResetInfo(): string[] {
		return [
			Log.title("Reset info"),
			`${Log.date(this.ns, new Date(this.ns.getResetInfo().lastAugReset))} since last augmentation reset`,
			Log.INFO('Augmentations', this.ns.getResetInfo().ownedAugs.size)
		]
	}

	showBitnode() {
		const currentNode: number = this.ns.getResetInfo().currentNode;

		let message: string[] = [
			Log.title("Bitnode"),
			Log.INFO('Current node', currentNode),
			`${Log.date(this.ns, new Date(this.ns.getResetInfo().lastNodeReset))} since last BitNode reset`
		];
		
		if (this.ns.getResetInfo().ownedSF.has(5)) {
			const bitNodeLvl = this.ns.getResetInfo().bitNodeOptions.sourceFileOverrides.get(currentNode) 
				?? this.ns.getResetInfo().ownedSF.get(currentNode) 
				?? 0;
			message.push(JSON.stringify(this.ns.getBitNodeMultipliers(currentNode, bitNodeLvl), null, 4));
		}

		return message;
	}

}