import * as Log from 'workspace/socle/utils/logging';
import { Info } from 'workspace/socle/interface/info';

/** @param {NS} ns */
export async function main(ns: NS) {
    const info: PlayerInfo = new PlayerInfo(ns);

    info.run();
}

class PlayerInfo extends Info {

	constructor(ns: NS) {
        super(ns, 'Self');
	}

    printData() {
		this.showPlayerStats();
		this.ns.print('\n')
		this.showResetInfo();
		this.ns.print('\n')
		this.showProductionInfo();
		this.ns.print('\n')
		this.showServeurs();
		this.ns.print('\n')
		this.showScriptFeatures();
	}

	showPlayerStats() {
		let player = this.ns.getPlayer();
		let totalSharePower = this.ns.getSharePower();
		let hackingLevel = this.ns.getHackingLevel();
		this.ns.print(Log.INFO("Hacking Level", hackingLevel));
		this.ns.print(Log.INFO("Share Power", totalSharePower));
		this.ns.print(Log.INFO("Factions", `${player.factions}`), ` (${Log.color(player.factions.length.toString(), Log.Color.CYAN)})`);
		//this.ns.print(Log.INFO("Entropy", player.entropy));
		this.ns.print(Log.INFO("People Killed", player.numPeopleKilled));
		this.ns.print(Log.INFO("Karma", this.ns.heart.break().toFixed(2)));
	}

	showScriptFeatures() {
		this.ns.print(Log.title("Script features"));
		this.ns.print(Log.INFO("Singularity", this.ns.getResetInfo().ownedSF.has(4) || this.ns.getResetInfo().currentNode === 4));
	}

	showResetInfo() {
		this.ns.print(Log.title("Reset info"));
		this.ns.print(Log.INFO('Augmentations', this.ns.getResetInfo().ownedAugs.size));
		this.ns.print(Log.INFO("Time since last augmentation", `${Log.date(this.ns, new Date(this.ns.getResetInfo().lastAugReset))}`));
	}

	showProductionInfo() {
		this.ns.print(Log.title("Production"));
		this.ns.print(Log.INFO("Current script production", Log.money(this.ns, this.ns.getTotalScriptIncome()[0]), '/s'));
		// get current node number
		const numNodes = this.ns.hacknet.numNodes();
		let hacknetProduction: number = 0;
		for (let i = 0; i < numNodes; i++) {
			hacknetProduction += this.ns.hacknet.getNodeStats(i).production;
		}
		this.ns.print(Log.INFO("Current Hacknet production", Log.money(this.ns, hacknetProduction), '/s'));
		this.ns.print(Log.INFO("Script production augmentation since augmentation", Log.money(this.ns, this.ns.getTotalScriptIncome()[1]), '/s'));
	}

	showServeurs() {
		// TODO : detail pour chaque serveurs
		this.ns.print(Log.title("Server"));
		this.ns.print(Log.color("Home", Log.Color.MAGENTA));
		this.ns.print(Log.INFO("Used RAM", this.ns.formatNumber(this.ns.getServer().ramUsed) + '/' + this.ns.formatNumber(this.ns.getServer().maxRam)));
		this.ns.print('\n')
		this.ns.print(Log.color("Servers owned", Log.Color.CYAN), ` (${Log.color(this.ns.getPurchasedServers().length.toString(), Log.Color.CYAN)})`);
		for (const owned of this.ns.getPurchasedServers()) {
			this.ns.print(Log.color(owned, Log.Color.YELLOW));
			this.ns.print(Log.INFO("Used RAM", this.ns.formatNumber(this.ns.getServer(owned).ramUsed) + 
			'/' + this.ns.formatNumber(this.ns.getServer(owned).maxRam)));
		}
	}
	
	showBitnode() {
		this.ns.print(Log.title("Bitnode"));
		this.ns.print(Log.INFO('Current node', this.ns.getResetInfo().currentNode));
		
		if (this.ns.getResetInfo().ownedSF.has(5)) {
			const bitNodeLvl = this.ns.getResetInfo().bitNodeOptions.sourceFileOverrides.get(this.ns.getResetInfo().currentNode) 
				?? this.ns.getResetInfo().ownedSF.get(this.ns.getResetInfo().currentNode) 
				?? 0;
			this.ns.print(this.ns.getBitNodeMultipliers(this.ns.getResetInfo().currentNode, bitNodeLvl));
		}
	}

}