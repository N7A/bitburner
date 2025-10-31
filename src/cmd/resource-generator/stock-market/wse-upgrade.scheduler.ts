import * as Log from 'workspace/socle/utils/logging';
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service'
import { selectUpgrade } from 'workspace/resource-generator/stock-market/wse-upgrade.selector'
import { WseUpgrade } from 'workspace/resource-generator/stock-market/model/WseUpgrade';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { Headhunter } from 'workspace/socle/interface/headhunter';
import { Logger } from 'workspace/socle/Logger';
import { DaemonFlags } from 'workspace/common/model/DaemonFlags';

//#region Constantes
const FLAGS_SCHEMA: [string, string | number | boolean | string[]][] = [
    [DaemonFlags.oneshot, false]
];
//#endregion Constantes

export async function main(ns: NS) {
    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);

    const upgradeHeadHunter: WseUpgradeHeadHunter = new WseUpgradeHeadHunter(ns);

    if (scriptFlags[DaemonFlags.oneshot]) {
        upgradeHeadHunter.killAfterLoop();
    }
    
    await upgradeHeadHunter.run();
    
    ns.ui.closeTail();
}

class WseUpgradeHeadHunter extends Headhunter<WseUpgrade> {
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