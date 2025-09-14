import { Daemon } from 'workspace/socle/interface/daemon';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service';

/**
 * @requires singularity
 * @param ns Bitburner API
 */
export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);

    const daemon: UpgradeHomeCoresDaemon = new UpgradeHomeCoresDaemon(ns);
    
    daemon.setupDashboard();

    if (!input.runHasLoop) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();
}

//#region Input arguments
type InputArg = {
    runHasLoop: boolean;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {

    return {
        runHasLoop: ns.args[0] !== undefined ? (ns.args[0] as boolean) : true
    };
}
//#endregion Input arguments

class UpgradeHomeCoresDaemon extends Daemon {
    private dashboard: Dashboard;
    private moneyPiggyBankService: MoneyPiggyBankService;

    constructor(ns: NS) {
        super(ns);
        
        this.dashboard = new Dashboard(ns, `Upgrade home cores`, {icon: '📈💻', role: 'Daemon'});
        this.moneyPiggyBankService = new MoneyPiggyBankService(ns);
    }

    async work() {
        // TODO: remplacer par add order to piggy-bank
        const cost: number = this.ns.singularity.getUpgradeHomeCoresCost();
        const availableMoney: number = this.moneyPiggyBankService.getDisponibleMoney(this.ns.getPlayer().money);
        
        if (cost <= availableMoney) {
            this.ns.singularity.upgradeHomeCores();
        }
    }
    
    //#region Dashboard
    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.enableLog('upgradeHomeCores');
        this.ns.clearLog();
        
        this.dashboard.initTailTitle();
    }
    //#endregion Dashboard
}