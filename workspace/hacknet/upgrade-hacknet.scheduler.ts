import { executeUpgrade } from 'workspace/hacknet/upgrade-hacknet.worker'
import { getBestProfits } from 'workspace/hacknet/upgrade-hacknet.target-selector'
import * as Log from 'workspace/frameworks/logging';
import * as Properties from 'workspace/hacknet/application-properties'
import { UpgradeExecution } from 'workspace/hacknet/model/UpgradeExecution'
import {Money as MoneyPiggyBank} from 'workspace/piggy-bank/application-properties'

/**
 * Runner qui gère l'achat des nodes Hacknet.
 * 
 * @param argument1 loop frequency time
 * 
 * @remarks Running RAM cost : 6,35GB
*/
export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);

    setupDashboard(ns);

    //#region input parameters
    /** loop frequency time */
    const interval: number = Properties.defaultInterval;
    //#endregion input parameters

    //#region Utils
	const getMoney = () => ns.getPlayer().money;
    //#endregion
    
    // select next upgrade
    let nextUpgrade: UpgradeExecution | undefined = getBestProfits(ns);
    do {
        if (!nextUpgrade) {
            continue;
        }

        // wait purchase to be possible
        while(MoneyPiggyBank.getDisponibleMoney(getMoney()) < nextUpgrade.cost) {
            refreshDashBoard(ns, getMoney(), interval, nextUpgrade);
            // sleep to prevent crash because of infinite loop
            await ns.sleep(500);
        }

        // get best purchase with max amount disponible
        const selectedUpgrade = getBestProfits(ns, MoneyPiggyBank.getDisponibleMoney(getMoney()));
        // do purchase
        executeUpgrade(ns, selectedUpgrade);
        
        if (input.runHasLoop) {
            nextUpgrade = getBestProfits(ns);
            
            refreshDashBoard(ns, getMoney(), interval, nextUpgrade);
        
            // sleep to prevent crash because of infinite loop
            await ns.sleep(interval);
        }
	} while (input.runHasLoop)
}

//#region Input arguments
type InputArg = {
	/** Serveur cible */
	runHasLoop: boolean;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
	return {
		runHasLoop: ns.args[0] ? (ns.args[0] as boolean) : false
	};
}
//#endregion Input arguments

function setupDashboard(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();
    
    ns.ui.openTail();
    Log.initTailTitle(ns, 'Hacknet', 'manager');
    ns.ui.moveTail(1000, 50);
    
    ns.print('Waiting to purchase next upgrade...');
}

function refreshDashBoard(ns: NS, currentMoney: number, interval: number | null, nextUpgrade?: UpgradeExecution | undefined) {
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
    if (nextUpgrade) {
        ns.print(Log.INFO('Next upgrade type', nextUpgrade.upgradeType));
        ns.print(Log.INFO('Next upgrade ratio', ns.formatNumber(nextUpgrade.ratio)));
        ns.print(Log.INFO('Next upgrade cost', Log.money(ns, nextUpgrade.cost)));
    }
    ns.print(Log.INFO(`Current money `, `\$${ns.formatNumber(currentMoney)}`));
    ns.print(Log.INFO(`Available`, `\$${ns.formatNumber(MoneyPiggyBank.getDisponibleMoney(currentMoney))}`));
    ns.ui.resizeTail(650, nodes.length * 25 + 300)
}
