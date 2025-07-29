import {Money as MoneyPiggyBank} from 'workspace/piggy-bank/application-properties'
import {selectUpgrade} from 'workspace/load-balancer/upgrade-servers.selector'
import {executeUpgrade} from 'workspace/load-balancer/upgrade-servers.worker'
import { UpgradeExecution } from 'workspace/load-balancer/model/UpgradeExecution'

export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);

    ns.ui.openTail();
    
    //#region Utils
	const getMoney = () => ns.getPlayer().money;
    //#endregion
    
    do {
        // select next upgrade
        let nextUpgrade: UpgradeExecution | undefined = await selectUpgrade(ns);
        if (!nextUpgrade) {
            continue;
        }

        ns.tprint('Prochain coût : ', nextUpgrade.cost, ` (${ns.formatRam(nextUpgrade.ram)})`);

        // wait purchase to be possible
        while(MoneyPiggyBank.getDisponibleMoney(getMoney()) < nextUpgrade.cost) {
            // sleep to prevent crash because of infinite loop
            await ns.sleep(500);
        }

        // get best purchase with max amount disponible
        const selectedUpgrade = await selectUpgrade(ns, MoneyPiggyBank.getDisponibleMoney(getMoney()));
        // do purchase
        await executeUpgrade(ns, selectedUpgrade);
        
        if (input.runHasLoop) {
            // sleep to prevent crash because of infinite loop
            await ns.sleep(1000 * 60 * 1);
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
