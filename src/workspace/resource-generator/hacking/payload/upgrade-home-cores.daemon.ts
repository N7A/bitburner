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
 * @param {AutocompleteData} data - context about the game, useful when autocompleting
 * @param {string[]} args - current arguments, not including "run script.js"
 * @returns {string[]} - the array of possible autocomplete options
 */
export function autocomplete(data: AutocompleteData, args: string[]): string[] {
  return FLAGS_SCHEMA
    .map(x => '--' + x[0])
    .filter(flag => !args.includes(flag));
}

/**
 * @requires singularity
 * @param ns Bitburner API
 */
export async function main(ns: NS) {
    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);

    const daemon: UpgradeHomeCoresDaemon = new UpgradeHomeCoresDaemon(ns);
    
    daemon.setupDashboard();

    if (scriptFlags[DaemonFlags.oneshot]) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();
}

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