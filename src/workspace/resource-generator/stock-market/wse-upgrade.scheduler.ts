import * as Log from 'workspace/frameworks/logging';
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service'
import { selectUpgrade } from 'workspace/resource-generator/stock-market/wse-upgrade.selector'
import { WseUpgrade } from 'workspace/resource-generator/stock-market/model/WseUpgrade';

// TODO : generic upgrade scheduler
export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);

    setupDashboard(ns);
    
    //#region Utils
	const getMoney = () => ns.getPlayer().money;
    //#endregion
    
    const moneyPiggyBankService = new MoneyPiggyBankService(ns);

    do {
        ns.print(Log.getStartLog());
        // select next upgrade
        const nextUpgrade: WseUpgrade | null = await selectUpgrade(ns);
        if (!nextUpgrade) {
            continue;
        }

        ns.print(Log.INFO('Prochain upgrade', `${nextUpgrade.name} (${Log.money(ns, nextUpgrade.cost)})`));

        ns.print('Waiting to have enough money...');
        // wait purchase to be possible
        while(moneyPiggyBankService.getDisponibleMoney(getMoney()) < nextUpgrade.cost) {
            // sleep to prevent crash because of infinite loop
            await ns.sleep(500);
        }
        
        ns.print('Buy upgrade');
        // do purchase
        ns.run(nextUpgrade.purchase);
        
        ns.print(Log.getEndLog());
        if (input.runHasLoop) {
            // sleep to prevent crash because of infinite loop
            await ns.sleep(500);
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
    
    Log.initTailTitle(ns, 'Upgrade WSE', 'scheduler');
    
    ns.print('Starting...');
    ns.ui.openTail();
}
//#endregion Dashboard