import * as Log from 'workspace/frameworks/logging'

/** @param {NS} ns */
export async function main(ns: NS) {
	let player = ns.getPlayer();
	let totalSharePower = ns.getSharePower();
	let hackingLevel = ns.getHackingLevel();
	ns.tprint(Log.getStartLog())
	
	ns.tprint(Log.INFO("Hacking Level", hackingLevel));
	ns.tprint(Log.INFO("Share Power", totalSharePower));
	ns.tprint(Log.INFO("Factions", `${player.factions}`), ` (${Log.color(player.factions.length.toString(), Log.Color.CYAN)})`);
	ns.tprint(Log.INFO("Entropy", player.entropy));
	ns.tprint(Log.INFO("People Killed", player.numPeopleKilled));
	ns.tprint(Log.INFO("Karma", ns.heart.break().toFixed(2)));
	ns.tprint('\n')
    ns.tprint(Log.color("Reset info", Log.Color.CYAN));
	ns.tprint(Log.INFO('Current node', ns.getResetInfo().currentNode));
	ns.tprint(Log.INFO('Augmentations', ns.getResetInfo().ownedAugs.size));
	ns.tprint(Log.INFO("Time since last augmentation", `${Log.date(ns, new Date(ns.getResetInfo().lastAugReset))}`));
	ns.tprint('\n')
    ns.tprint(Log.color("Production", Log.Color.CYAN));
	ns.tprint(Log.INFO("Current script production", Log.money(ns, ns.getTotalScriptIncome()[0]), '/s'));
	// get current node number
    const numNodes = ns.hacknet.numNodes();
	let hacknetProduction: number = 0;
    for (let i = 0; i < numNodes; i++) {
		hacknetProduction += ns.hacknet.getNodeStats(i).production;
	}
	ns.tprint(Log.INFO("Current Hacknet production", Log.money(ns, hacknetProduction), '/s'));
	ns.tprint(Log.INFO("Script production augmentation since augmentation", Log.money(ns, ns.getTotalScriptIncome()[1]), '/s'));
	ns.tprint('\n')

	// TODO : detail pour chaque serveurs
    ns.tprint(Log.color("Server", Log.Color.CYAN));
    ns.tprint(Log.color("Home", Log.Color.MAGENTA));
    ns.tprint(Log.INFO("Used RAM", ns.formatNumber(ns.getServer().ramUsed) + '/' + ns.formatNumber(ns.getServer().maxRam)));
	ns.tprint('\n')
	ns.tprint(Log.color("Servers owned", Log.Color.CYAN), ` (${Log.color(ns.getPurchasedServers().length.toString(), Log.Color.CYAN)})`);
	for (const owned of ns.getPurchasedServers()) {
    	ns.tprint(Log.color(owned, Log.Color.YELLOW));
    	ns.tprint(Log.INFO("Used RAM", ns.formatNumber(ns.getServer(owned).ramUsed) + 
		'/' + ns.formatNumber(ns.getServer(owned).maxRam)));
	}

	ns.tprint(Log.getEndLog())
}