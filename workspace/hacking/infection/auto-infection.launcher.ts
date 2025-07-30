import * as Referentiel from 'workspace/referentiel'
import * as Log from 'workspace/logging-framework/main'
import { waitEndExecution } from 'workspace/frameworks/execution'

export async function main(ns: NS) {
    setupDashboard(ns);

    // execution du premier scan
    ns.print(`First ${Log.action('scan')} execution`);
    const pidScan = ns.run(Referentiel.HACKING_DIRECTORY + '/scan/scan.launcher.ts');
    
    // attendre la fin du scan
    ns.print(`Waiting ${Log.action('scan')} ending...`);
    await waitEndExecution(ns, pidScan);

    ns.print(`Start ${Log.script('infection scheduler')}`);
    ns.run(Referentiel.HACKING_DIRECTORY + '/infection/infection.scheduler.ts');

    ns.ui.closeTail();
}

function setupDashboard(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();
    
    ns.ui.openTail();
    ns.ui.setTailTitle('Infection #Launcher');
}
