import { getScanTarget } from 'workspace/hacking/scan/scan.target-selector'
import { main as doScan } from 'workspace/hacking/scan/scan.worker'
import * as Log from 'workspace/frameworks/logging';

//#region Constantes
const selectTarget = getScanTarget
const work = doScan
const isKillConditionReached = (scanTargets: string[]): boolean => {
    // tant qu'on a de nouvelles cibles
    return scanTargets.length === 0
}
//#endregion Constantes

/**
 * Cartographie et enregistre les données des serveurs du réseau.
 */
export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);

    setupDashboard(ns);

    // load targets
    let targets: string[] = selectTarget(ns);
    do {
        ns.print(Log.getStartLog());
        ns.print(Log.INFO('Selected targets', targets));

        ns.print('Wait scan end...');
        await work(ns, targets);

        targets = selectTarget(ns);

        // TODO : when new unlock target, si infection not running -> execute infection
        ns.print(Log.getEndLog());
	} while (input.runHasLoop && !isKillConditionReached(targets))

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
