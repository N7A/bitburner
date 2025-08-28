import { getScanTarget } from 'workspace/resource-generator/hacking/scan/scan.target-selector'
import { main as doScan } from 'workspace/resource-generator/hacking/scan/scan.worker'
import * as Log from 'workspace/socle/utils/logging';
import { Headhunter } from 'workspace/socle/interface/headhunter';

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

class Main extends Headhunter<string> {
    constructor(ns: NS) {
        // waitNewTargets = false : targets fix and auto discovered
        super(ns, false)
        this.setupDashboard();
    }
    
    async work(targets: string[]): Promise<any> {
        for (const target of targets) {
            this.ns.print('Wait scan end...');
            await doScan(this.ns, target);
            // TODO : when new unlock target, si infection not running -> execute infection
        }
    }

    async getTargets(): Promise<string[]> {
        return getScanTarget(this.ns);
    }

    //#region Dashboard
    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
        
        Log.initTailTitle(this.ns, 'Scan', 'Scheduler');
        this.ns.ui.openTail();
    }
    //#endregion Dashboard
}