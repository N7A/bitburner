import * as Referentiel from 'workspace/referentiel'
import * as Log from 'workspace/frameworks/logging';

export async function main(ns: NS) {
    setupDashboard(ns);

    // démarrage du scan
    ns.print(`Start ${Log.action('scan')} execution`);
    ns.tprint(`Start ${Log.action('scan')} execution`);
    ns.run(Referentiel.HACKING_DIRECTORY + '/scan/scan.scheduler.ts', 1, true);
    
    ns.print(`Start ${Log.action('infection')} execution`);
    ns.tprint(`Start ${Log.action('infection')} execution`);
    ns.run(Referentiel.HACKING_DIRECTORY + '/infection/infection.scheduler.ts');
}

function setupDashboard(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();
    
    ns.ui.setTailTitle('Infection #Launcher');
}
