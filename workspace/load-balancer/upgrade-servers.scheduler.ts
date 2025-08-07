import * as Log from 'workspace/frameworks/logging';
import {Money as MoneyPiggyBank} from 'workspace/piggy-bank/application-properties'
import {selectUpgrade} from 'workspace/load-balancer/upgrade-servers.selector'
import {executeUpgrade} from 'workspace/load-balancer/upgrade-servers.worker'
import { UpgradeExecution } from 'workspace/load-balancer/model/UpgradeExecution'

export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);

    setupDashboard(ns);
    
    //#region Utils
	const getMoney = () => ns.getPlayer().money;
    //#endregion
    
    do {
        ns.print(Log.getStartLog());
        // select next upgrade
        let nextUpgrade: UpgradeExecution | undefined = await selectUpgrade(ns);
        if (!nextUpgrade) {
            continue;
        }

        ns.print(Log.INFO('Prochain coût', `${Log.money(ns, nextUpgrade.cost)} (${ns.formatRam(nextUpgrade.ram)})`));

        ns.print('Waiting to have enough money...');
        // wait purchase to be possible
        while(MoneyPiggyBank.getDisponibleMoney(getMoney()) < nextUpgrade.cost) {
            // sleep to prevent crash because of infinite loop
            await ns.sleep(500);
        }

        // get best purchase with max amount disponible
        const selectedUpgrade = await selectUpgrade(ns, MoneyPiggyBank.getDisponibleMoney(getMoney()));
        
        ns.print('Buy upgrade');
        // do purchase
        await executeUpgrade(ns, selectedUpgrade);
        
        ns.print(Log.getEndLog());
        if (input.runHasLoop) {
            // sleep to prevent crash because of infinite loop
            await ns.sleep(1000 * 60 * 1);
        }
	} while (input.runHasLoop)
    
    ns.ui.closeTail();
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

//#region Dashboard
function setupDashboard(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();
    
    Log.initTailTitle(ns, 'Upgrade server', 'scheduler');
    
    ns.print('Starting...');
    ns.ui.openTail();
}
//#endregion Dashboard