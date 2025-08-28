import { executeUpgrade } from 'workspace/resource-generator/hacknet/upgrade-hacknet.worker'
import { getBestProfits } from 'workspace/resource-generator/hacknet/upgrade-hacknet.target-selector'
import * as Log from 'workspace/frameworks/logging';
import * as Properties from 'workspace/resource-generator/hacknet/application-properties'
import { UpgradeExecution } from 'workspace/resource-generator/hacknet/model/UpgradeExecution'
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service';

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
    
    const moneyPiggyBankService = new MoneyPiggyBankService(ns);
    
    // select next upgrade
    let nextUpgrade: UpgradeExecution | undefined = getBestProfits(ns);
    do {
        if (!nextUpgrade) {
            continue;
        }

        // wait purchase to be possible
        while(moneyPiggyBankService.getDisponibleMoney(getMoney()) < nextUpgrade.cost) {
            refreshDashBoard(ns, getMoney(), interval, nextUpgrade);
            // sleep to prevent crash because of infinite loop
            await ns.sleep(500);
        }

        // get best purchase with max amount disponible
        const selectedUpgrade = getBestProfits(ns, moneyPiggyBankService.getDisponibleMoney(getMoney()));
        // do purchase
        executeUpgrade(ns, selectedUpgrade);
        

        if (input.runHasLoop) {
            // wait purchase to be possible
            while(getAutoRepayTime(ns) > 1000 * 60 * 60 * 5) {
                refreshDashBoard(ns, getMoney(), interval, nextUpgrade);
                // sleep to prevent crash because of infinite loop
                await ns.sleep(500);
            }
            
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
    const allNodes: NodeStats[] = Array(ns.hacknet.numNodes()).fill(0)
        .map((value, index) => ns.hacknet.getNodeStats(index));
    const nodesToShow: NodeStats[] = allNodes
        .filter(x => x.cores < 16 || x.level < 200 || x.ram < 64);
    
    ns.print(`Nodes: ${ns.hacknet.numNodes()}`);

    if (nodesToShow.length > 0) {
        ns.print(Log.buildTable(
                ["Node", "Produced", "Uptime", "Production", "Level", "RAM", "Cores"],
                nodesToShow.map((v, i) => `${i}`),
                nodesToShow.map((v, i) => `${Log.money(ns, v.totalProduction, true)}`),
                nodesToShow.map((v, i) => `${new Date(v.timeOnline * 1000).toLocaleTimeString()}`),
                nodesToShow.map((v, i) => `${Log.money(ns, v.production, true)} /s`),
                //nodes.map((v, i) => `${ns.formatRam(v.ramUsed ?? 0)}`),
                nodesToShow.map((v, i) => `${v.level}`),
                nodesToShow.map((v, i) => `${v.ram}`),
                nodesToShow.map((v, i) => `${v.cores}`),
            ));
    }
    
    if (interval !== null) {
        ns.print('\n');
        ns.print('Next refresh on ', Log.date(ns,new Date(new Date().getTime() + interval * 1000)));
    }

    const currentGain = ns.getMoneySources().sinceInstall.hacknet + ns.getMoneySources().sinceInstall.hacknet_expenses;
    if (currentGain < 0) {
        ns.print(Log.INFO(`Auto-repay time`, `${Log.time(new Date(getAutoRepayTime(ns)))}`));
    }
    if (nextUpgrade) {
        ns.print(Log.INFO('Next upgrade type', nextUpgrade.upgradeType));
        ns.print(Log.INFO('Next upgrade ratio', ns.formatNumber(nextUpgrade.ratio)));
        ns.print(Log.INFO('Next upgrade cost', Log.money(ns, nextUpgrade.cost)));
    }
    ns.print(Log.INFO(`Current money `, `${Log.money(ns, currentMoney)}`));
    ns.print(Log.INFO(`Available`, `${Log.money(ns, new MoneyPiggyBankService(ns).getDisponibleMoney(currentMoney))}`));
    ns.ui.resizeTail(650, Math.min(nodesToShow.length * 25 + 300, 600))
}

function getAutoRepayTime(ns: NS) {
    const currentGain = ns.getMoneySources().sinceInstall.hacknet + ns.getMoneySources().sinceInstall.hacknet_expenses;
    const totalProduction: number = Array(ns.hacknet.numNodes()).fill(0)
        .map((value, index) => ns.hacknet.getNodeStats(index).production)
        .reduce((a,b) => a + b);
    return -currentGain/totalProduction * 1000
}