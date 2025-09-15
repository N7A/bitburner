import { Headhunter } from 'workspace/socle/interface/headhunter';
import { FactionSelector } from 'workspace/resource-generator/faction/faction.selector';
import { Dashboard } from 'workspace/socle/interface/dashboard';

/**
 * @requires singularity
 * @param ns 
 */
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
        runHasLoop: ns.args[0] !== undefined ? (ns.args[0] as boolean) : false
    };
}
//#endregion Input arguments

class Main extends Headhunter<string> {
    private dashboard: Dashboard;

    constructor(ns: NS) {
        // waitNewTargets = true : faction invitation appear over the time
        super(ns, true);
        
        this.dashboard = new Dashboard(ns, 'Join faction', {icon: '⚜️🤝', role: 'Scheduler'});
    }

    async work(targets: string[]): Promise<any> {
        targets.forEach(x => this.ns.singularity.joinFaction(x));
    }

    protected async getTargets(): Promise<string[]> {
        return new FactionSelector().getWantedFactions(this.ns)
            // TODO: directive pour savoir quelles factions futur on veux pour éviter les enemies qu'on ne veux pas
            .filter(x => this.ns.singularity.getFactionEnemies(x).length <= 0);
    }

    isKillConditionReached(): boolean {
        // all faction joined
        return Array.from(new Set(Object.values(this.ns.enums.FactionName)))
            .every(x => this.ns.getPlayer().factions.includes(x));
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