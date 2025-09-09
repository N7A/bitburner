import { Headhunter } from 'workspace/socle/interface/headhunter';
import * as Log from 'workspace/socle/utils/logging';

export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);

    const daemon = new Main(ns);
    
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

class Main extends Headhunter<string> {
    constructor(ns: NS) {
        // waitNewTargets = true : faction invitation appear over the time
        super(ns, true)
        this.setupDashboard();
    }

    async work(targets: string[]): Promise<any> {
        targets.forEach(x => this.ns.singularity.joinFaction(x));
    }

    protected async getTargets(): Promise<string[]> {
        return this.ns.singularity.checkFactionInvitations()
            // faction have not owned augmentation
            .filter(faction => this.ns.singularity.getAugmentationsFromFaction(faction)
                .some(x => !this.ns.singularity.getOwnedAugmentations(true).includes(x)))
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
        
        Log.initTailTitle(this.ns, 'Join faction', 'Scheduler');
        this.ns.ui.openTail();
    }
    //#endregion Dashboard
}