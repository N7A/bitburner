import { Daemon } from 'workspace/socle/interface/daemon';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service';
import { DaemonFlags } from 'workspace/common/model/DaemonFlags';

//#region Constantes
const FLAGS_SCHEMA: [string, string | number | boolean | string[]][] = [
    [DaemonFlags.oneshot, false]
];
//#endregion Constantes

/**
 * @requires singularity
 * @param ns Bitburner API
 */
export async function main(ns: NS) {
    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);

    const daemon: UpgradeHomeRamDaemon = new UpgradeHomeRamDaemon(ns);
    
    daemon.setupDashboard();

    if (scriptFlags[DaemonFlags.oneshot]) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();
}

class UpgradeHomeRamDaemon extends Daemon {
    private dashboard: Dashboard;
    private moneyPiggyBankService: MoneyPiggyBankService;

    constructor(ns: NS) {
        super(ns);
        
        this.dashboard = new Dashboard(ns, `Upgrade home ram`, {icon: '📈⚡', role: 'Daemon'});
        this.moneyPiggyBankService = new MoneyPiggyBankService(ns);
    }

    async work() {
        const cost: number = this.ns.singularity.getUpgradeHomeRamCost();
        const availableMoney: number = this.moneyPiggyBankService.getDisponibleMoney(this.ns.getPlayer().money);
        
        if (cost <= availableMoney) {
            this.ns.singularity.upgradeHomeRam();
        }
    }
    
    //#region Dashboard
    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.enableLog('upgradeHomeRam');
        this.ns.clearLog();
        
        this.dashboard.initTailTitle();
    }
    //#endregion Dashboard
}