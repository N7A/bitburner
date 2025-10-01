import * as Log from 'workspace/socle/utils/logging';
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service'
import { selectUpgrade } from 'workspace/resource-generator/hacking/unlock/darkweb-upgrade.selector'
import { DarkwebUpgrade } from 'workspace/resource-generator/hacking/unlock/model/DarkwebUpgrade';
import { Headhunter } from 'workspace/socle/interface/headhunter';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { DaemonFlags } from 'workspace/common/model/DaemonFlags';

//#region Constantes
const FLAGS_SCHEMA: [string, string | number | boolean | string[]][] = [
    [DaemonFlags.oneshot, false]
];
//#endregion Constantes

export async function main(ns: NS) {
    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);

    const daemon = new Main(ns);
    
    daemon.setupDashboard();
    
    if (scriptFlags[DaemonFlags.oneshot]) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();

    ns.ui.closeTail();
}

class Main extends Headhunter<DarkwebUpgrade> {
    private moneyPiggyBankService: MoneyPiggyBankService;
    private dashboard: Dashboard;

    //#region Utils
	getMoney = () => this.ns.getPlayer().money;
    //#endregion
    
    constructor(ns: NS) {
        // waitNewTargets = false : all upgrades bought
        super(ns, false)
        this.moneyPiggyBankService = new MoneyPiggyBankService(ns);

        this.dashboard = new Dashboard(ns, 'Upgrade darkweb', {icon: '🧅', role: 'Scheduler'});
        this.setupDashboard();
    }

    async work(targets: DarkwebUpgrade[]): Promise<any> {
        const nextUpgrade = targets[0];

        this.ns.print(Log.INFO('Prochaine amélioration', `${nextUpgrade.name} (${Log.money(this.ns, nextUpgrade.cost)})`));

        this.ns.print('Waiting to have enough money...');
        // wait purchase to be possible
        while(this.moneyPiggyBankService.getDisponibleMoney(this.getMoney()) < nextUpgrade.cost) {
            // sleep to prevent crash because of infinite loop
            await this.ns.sleep(500);
        }
        
        this.ns.print('Achat de l\'amélioration');
        // do purchase
        this.ns.run(nextUpgrade.purchase);
    }

    protected async getTargets(): Promise<DarkwebUpgrade[]> {
        const target = await selectUpgrade(this.ns);
        return target ? [target] : [];
    }

    //#region Dashboard
    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
        
        this.dashboard.initTailTitle();
        this.ns.ui.openTail();
    }
    //#endregion Dashboard
}