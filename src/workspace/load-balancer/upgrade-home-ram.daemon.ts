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

    const daemon: UpgradeHomeRamDaemon = new UpgradeHomeRamDaemon(ns);
    
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