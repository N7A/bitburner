import * as Log from 'workspace/socle/utils/logging';
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service'
import { selectUpgrade } from 'workspace/resource-generator/stock-market/wse-upgrade.selector'
import { WseUpgrade } from 'workspace/resource-generator/stock-market/model/WseUpgrade';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { Headhunter } from 'workspace/socle/interface/headhunter';
import { Logger } from 'workspace/socle/Logger';

// TODO : generic upgrade scheduler
export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);

    const upgradeHeadHunter: WseUpgradeHeadHunter = new WseUpgradeHeadHunter(ns);

    if (!input.runHasLoop) {
        upgradeHeadHunter.killAfterLoop();
    }
    
    await upgradeHeadHunter.run();
    
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
		runHasLoop: ns.args[0] !== undefined ? (ns.args[0] as boolean) : false
	};
}
//#endregion Input arguments

class WseUpgradeHeadHunter extends Headhunter<WseUpgrade> {
    private logger: Logger;
    private dashboard: Dashboard;
    private moneyPiggyBankService: MoneyPiggyBankService;
    
    constructor(ns: NS) {
        super(ns, false)
        this.logger = new Logger(ns);
        this.dashboard = new Dashboard(ns, 'Upgrade WSE', {icon: '🆙🏠', role: 'scheduler'});
        this.setupDashboard();
        
        this.moneyPiggyBankService = new MoneyPiggyBankService(ns);
    }
    
    protected async work(targets: WseUpgrade[]): Promise<any> {
        for (const target of targets) {
            this.logger.log(Log.INFO('Prochaine amélioration', `${target.name} (${Log.money(this.ns, target.cost)})`));

            this.logger.waiting('Waiting to have enough money');
            // wait purchase to be possible
            while(this.moneyPiggyBankService.getDisponibleMoney(this.getMoney()) < target.cost) {
                // sleep to prevent crash because of infinite loop
                await this.ns.sleep(500);
            }
            this.logger.stopWaiting();
            
            this.logger.log('Achat de l\'amélioration');
            // do purchase
            this.ns.run(target.purchase);
        }
    }

    async getTargets(): Promise<WseUpgrade[]> {
        const nextUpgrade: WseUpgrade | undefined = await selectUpgrade(this.ns);
        return nextUpgrade ? [nextUpgrade] : []
    }
    
    //#region Utils
    getMoney = () => this.ns.getPlayer().money;
    //#endregion
        
    //#region Dashboard
    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
        
        this.dashboard.initTailTitle();

        this.logger.log('Starting...');
        this.ns.ui.openTail();
    }
    //#endregion Dashboard
}