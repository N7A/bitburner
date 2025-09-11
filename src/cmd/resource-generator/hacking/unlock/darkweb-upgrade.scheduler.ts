import * as Log from 'workspace/socle/utils/logging';
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service'
import { selectUpgrade } from 'workspace/resource-generator/hacking/unlock/darkweb-upgrade.selector'
import { DarkwebUpgrade } from 'workspace/resource-generator/hacking/unlock/model/DarkwebUpgrade';
import { Headhunter } from 'workspace/socle/interface/headhunter';
import { Dashboard } from 'workspace/socle/interface/dashboard';

export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);

    const daemon = new Main(ns);
    
    daemon.setupDashboard();
    
    if (!input.runHasLoop) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();

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