import * as Log from 'workspace/socle/utils/logging';
import {selectUpgrade} from 'workspace/load-balancer/upgrade-servers.selector'
import {executeUpgrade} from 'workspace/load-balancer/upgrade-servers.worker'
import { UpgradeExecution } from 'workspace/load-balancer/model/UpgradeExecution'
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service';
import { Daemon } from 'workspace/socle/interface/daemon';

export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);

    const daemon = new UpgradeServersDaemon(ns);
    
    daemon.setupDashboard();

    if (!input.runHasLoop) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();
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
		runHasLoop: ns.args[0] !== undefined ? (ns.args[0] as boolean) : false
	};
}
//#endregion Input arguments

class UpgradeServersDaemon extends Daemon {
    private moneyPiggyBankService: MoneyPiggyBankService;

    constructor(ns: NS) {
        super(ns);

        this.moneyPiggyBankService = new MoneyPiggyBankService(ns);
    }

    async work(): Promise<any> {
        // select next upgrade
        let nextUpgrade: UpgradeExecution | undefined = await this.getNextExecution();
        if (!nextUpgrade) {
            return;
        }
        this.ns.print(Log.INFO('Prochain coût', `${Log.money(this.ns, nextUpgrade.cost)} (${this.ns.formatRam(nextUpgrade.ram)})`));

        // Waiting to have enough money
        this.ns.print('Waiting to have enough money...');
        await this.waitExecutionTime(nextUpgrade);

        // do purchase
        await this.execute();
    }

    async getNextExecution() {
        return await selectUpgrade(this.ns);
    }

    async waitExecutionTime(nextUpgrade: UpgradeExecution) {
        // wait purchase to be possible
        while(this.moneyPiggyBankService.getDisponibleMoney(this.getMoney()) < nextUpgrade.cost) {
            // sleep to prevent crash because of infinite loop
            await this.ns.sleep(500);
        }
    }

    async execute() {
        // get best purchase with max amount disponible
        const selectedUpgrade = await selectUpgrade(this.ns, this.moneyPiggyBankService.getDisponibleMoney(this.getMoney()));
        
        this.ns.print('Buy upgrade');
        // do purchase
        await executeUpgrade(this.ns, selectedUpgrade);
    }

    //#region Utils
	getMoney = () => this.ns.getPlayer().money;
    //#endregion Utils
    
    //#region Dashboard
    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
        
        Log.initTailTitle(this.ns, 'Upgrade server', 'scheduler');
        
        this.ns.print('Starting...');
        this.ns.ui.openTail();
    }
    //#endregion Dashboard
}