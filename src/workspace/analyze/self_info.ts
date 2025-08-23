import * as Log from 'workspace/frameworks/logging';
import { Logger } from 'workspace/common/Logger';

/** @param {NS} ns */
export async function main(ns: NS) {
	const main: Main = new Main(ns);

	ns.print(Log.getStartLog())
	
	main.showPlayeurStats();
	ns.print('\n')
    main.showResetInfo();
	ns.print('\n')
    main.showProductionInfo();
	ns.print('\n')
	main.showServeurs();

	ns.print(Log.getEndLog())
}

class Main {
	private ns: NS;
	private logger: Logger

	constructor(ns: NS) {
		this.ns = ns;
		this.logger = new Logger(ns);
		this.setupDashboard();
	}

	showPlayeurStats() {
		let player = this.ns.getPlayer();
		let totalSharePower = this.ns.getSharePower();
		let hackingLevel = this.ns.getHackingLevel();
		this.ns.print(Log.INFO("Hacking Level", hackingLevel));
		this.ns.print(Log.INFO("Share Power", totalSharePower));
		this.ns.print(Log.INFO("Factions", `${player.factions}`), ` (${Log.color(player.factions.length.toString(), Log.Color.CYAN)})`);
		this.ns.print(Log.INFO("Entropy", player.entropy));
		this.ns.print(Log.INFO("People Killed", player.numPeopleKilled));
		this.ns.print(Log.INFO("Karma", this.ns.heart.break().toFixed(2)));
	}

	showResetInfo() {
		this.ns.print(Log.color("Reset info", Log.Color.CYAN));
		this.ns.print(Log.INFO('Current node', this.ns.getResetInfo().currentNode));
		this.ns.print(Log.INFO('Augmentations', this.ns.getResetInfo().ownedAugs.size));
		this.ns.print(Log.INFO("Time since last augmentation", `${Log.date(this.ns, new Date(this.ns.getResetInfo().lastAugReset))}`));
	}

	showProductionInfo() {
		this.ns.print(Log.color("Production", Log.Color.CYAN));
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
		this.ns.print(Log.color("Server", Log.Color.CYAN));
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

	//#region Dashboard
	private setupDashboard() {
		this.ns.disableLog("ALL");
		this.ns.clearLog();
		
		Log.initTailTitle(this.ns, 'Self', 'info');
		
		this.ns.ui.openTail();
	}
	//#endregion Dashboard
}