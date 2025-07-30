import { getScanTarget } from 'workspace/hacking/scan/scan.selector'
import { main as doScan } from 'workspace/hacking/scan/scan.worker'
import * as Log from 'workspace/logging-framework/main'

/**
 * Scan les cibles données par le unlock.
 */
export async function main(ns: NS) {
    setupDashboard(ns);

    // load targets
    let scanTargets: string[] = getScanTarget(ns);
    ns.print(Log.INFO('Selected targets', scanTargets));

    doScan(ns, scanTargets);
    
    // TODO : when new unlock target, si infection not running -> execute infection

    ns.ui.closeTail();
}

function setupDashboard(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();
    
    ns.ui.openTail();
    ns.ui.setTailTitle('Scan #Sequencer');
}
