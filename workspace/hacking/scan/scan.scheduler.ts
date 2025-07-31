import { getScanTarget } from 'workspace/hacking/scan/scan.target-selector'
import { main as doScan } from 'workspace/hacking/scan/scan.worker'
import * as Log from 'workspace/frameworks/logging';

/**
 * Scan les cibles données par le unlock.
 */
export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);

    setupDashboard(ns);

    // load targets
    let scanTargets: string[] = getScanTarget(ns);
    do {
        ns.print(Log.getStartLog());
        ns.print(Log.INFO('Selected targets', scanTargets));

        ns.print('Wait scan end...');
        await doScan(ns, scanTargets);

        scanTargets = getScanTarget(ns);

        // TODO : when new unlock target, si infection not running -> execute infection
        ns.print(Log.getEndLog());
	} while (input.runHasLoop && scanTargets.length > 0) // tant qu'on a de nouvelles cibles

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

function setupDashboard(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();
    
    ns.ui.openTail();
    ns.ui.setTailTitle('Scan #Scheduler');
}
