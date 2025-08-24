import { Daemon } from 'workspace/common/daemon';
import * as Log from 'workspace/frameworks/logging';

/**
 * Cartographie et enregistre les données des serveurs du réseau.
 */
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

class Main extends Daemon {
    constructor(ns: NS) {
        // waitNewTargets = true : no targets
        super(ns)
        this.setupDashboard();
    }

    async work(targets: string[]): Promise<any> {
        const recruitsAvailable: number = this.ns.gang.getRecruitsAvailable();
        if (recruitsAvailable > 0) {
            // TODO: select name
            this.ns.gang.recruitMember('');
            // TODO: new employee guide
            // training, equip, give task
        }
    }
    
    isKillConditionReached(): boolean {
        // gang size limit reached
        return this.ns.gang.respectForNextRecruit() === Infinity;
    }

    //#region Dashboard
    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
        
        Log.initTailTitle(this.ns, 'Recruit', 'Scheduler');
        this.ns.ui.openTail();
    }
    //#endregion Dashboard
}