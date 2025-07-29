import { upgrade } from 'workspace/hacknet/upgrade-hacknet.worker'
import * as Log from 'workspace/logging-framework/main'
import * as Properties from 'workspace/hacknet/application-properties'

/**
 * Runner qui gère l'achat des nodes Hacknet.
 * 
 * @param argument1 loop frequency time
*/
export async function main(ns: NS) {
    setupDashboard(ns);

    //#region input parameters
    /** loop frequency time */
    const interval: number = (ns.args[0] as number) || Properties.defaultInterval;
    //#endregion input parameters

    //#region Utils
	const getMoney = () => ns.getPlayer().money;
    //#endregion
    
    let moneyOnStart: number = getMoney();
    let threshold: number = Math.max(moneyOnStart * (1 - Properties.moneyRateToSpend), Properties.moneyReserve);
    let noUpgrade: boolean = true;
    while (true) {
        noUpgrade = !upgrade(ns, moneyOnStart-threshold);
        
        if (getMoney() <= threshold || noUpgrade) {		
            refreshDashBoard(ns, moneyOnStart, threshold, interval/1000);
            await ns.sleep(interval);
            moneyOnStart = getMoney();
            threshold = Math.max(moneyOnStart * (1 - Properties.moneyRateToSpend), Properties.moneyReserve);
        } else {
            refreshDashBoard(ns, moneyOnStart, threshold, null);
            // sleep to prevent crash because of infinite loop
            await ns.sleep(500);
        }
	}
}

/** @param {import(".").NS } ns */
function setupDashboard(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();
    
    ns.ui.openTail();
    ns.ui.setTailTitle('Hacknet Manager');
    ns.ui.moveTail(1200, 50);
    
    ns.print('Waiting to purchase next upgrade...');
}

/** @param {import(".").NS } ns */
function refreshDashBoard(ns: NS, moneyOnStart: number, threshold: number, interval: number | null) {
    ns.clearLog();
    let nodes = Array(ns.hacknet.numNodes()).fill(0);
    
    ns.print(`Nodes: ${nodes.length}`);

    ns.print(Log.buildTable(
            ["Node", "Produced", "Uptime", "Production", "Level", "RAM", "Cores"],
            nodes.map((v, i) => `${i}`),
            nodes.map((v, i) => `\$${ns.formatNumber(ns.hacknet.getNodeStats(i).totalProduction)}`),
            nodes.map((v, i) => `${new Date(ns.hacknet.getNodeStats(i).timeOnline * 1000).toLocaleTimeString()}`),
            nodes.map((v, i) => `\$${ns.formatNumber(ns.hacknet.getNodeStats(i).production)} /s`),
            nodes.map((v, i) => `${ns.hacknet.getNodeStats(i).level}`),
            nodes.map((v, i) => `${ns.hacknet.getNodeStats(i).ram}`),
            nodes.map((v, i) => `${ns.hacknet.getNodeStats(i).cores}`),
        ));
    
    if (interval !== null) {
        ns.print('\n');
        ns.print('Next refresh on ', Log.date(ns,new Date(new Date().getTime() + interval * 1000)));
    }
    ns.print(Log.INFO(`Money on start`, `\$${ns.formatNumber(moneyOnStart)}`));
    ns.print(Log.INFO(`Money rate to spend`, `${ns.formatPercent(Properties.moneyRateToSpend)}`));
    ns.print(Log.INFO(`Money to not spend`, `\$${ns.formatNumber(Properties.moneyReserve)}`));
    ns.print(Log.INFO(`Threshold`, `\$${ns.formatNumber(threshold)}`));
}
