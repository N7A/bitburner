import * as Log from 'workspace/socle/utils/logging';
import {selectUpgrade} from 'workspace/load-balancer/upgrade-servers.selector'
import {executeUpgrade} from 'workspace/load-balancer/upgrade-servers.worker'
import { UpgradeExecution } from 'workspace/load-balancer/model/UpgradeExecution'
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service';
import { Daemon } from 'workspace/socle/interface/daemon';
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

    const daemon = new UpgradeServersDaemon(ns);
    
    daemon.setupDashboard();

    if (scriptFlags[DaemonFlags.oneshot]) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();
}

class UpgradeServersDaemon extends Daemon {
    private dashboard: Dashboard;
    private moneyPiggyBankService: MoneyPiggyBankService;

    constructor(ns: NS) {
        super(ns);

        this.moneyPiggyBankService = new MoneyPiggyBankService(ns);
        this.dashboard = new Dashboard(ns, 'Upgrade server', {icon: '🆙🏠', role: 'Scheduler'});
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
        
        this.dashboard.initTailTitle();
        
        this.ns.print('Starting...');
        this.ns.ui.openTail();
    }
    //#endregion Dashboard
}