import { getScanTarget } from 'workspace/resource-generator/hacking/scan/scan.target-selector'
import { main as doScan } from 'workspace/resource-generator/hacking/scan/scan.worker'
import * as Log from 'workspace/frameworks/logging';
import { Headhunter } from 'workspace/common/headhunter';

//#region Constantes
const getTargets = async (ns: NS) => getScanTarget(ns)
const work = async (ns: NS, targets: string[]) => {
    for (const target of targets) {
        ns.print('Wait scan end...');
        await doScan(ns, target);
        // TODO : when new unlock target, si infection not running -> execute infection
    }
}
//#endregion Constantes

/**
 * Cartographie et enregistre les données des serveurs du réseau.
 */
export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);

    setupDashboard(ns);

    // waitNewTargets = false : targets fix and auto discovered
    const daemon = new Headhunter<string>(ns, () => getTargets(ns), work, false);
    
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

//#region Dashboard
function setupDashboard(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();
    
    Log.initTailTitle(ns, 'Scan', 'Scheduler');
    ns.ui.openTail();
}
//#endregion Dashboard
