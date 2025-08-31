import * as Referentiel from 'workspace/referentiel'
import * as Log from 'workspace/socle/utils/logging';
import { Dashboard } from 'workspace/socle/interface/dashboard';

//#region Constants
export const SCAN_SCRIPT = Referentiel.CMD_HACKING_DIRECTORY + '/scan/scan.scheduler.ts';
export const INFECTION_SCRIPT = Referentiel.CMD_HACKING_DIRECTORY + '/infection/infection.scheduler.ts';
//#endregion Constants

export async function main(ns: NS) {
    setupDashboard(ns);

    // démarrage du scan
    ns.print(`Start ${Log.action('scan')} execution`);
    ns.tprint(`Start ${Log.action('scan')} execution`);
    ns.run(SCAN_SCRIPT, 1, true);
    
    ns.print(`Start ${Log.action('infection')} execution`);
    ns.tprint(`Start ${Log.action('infection')} execution`);
    ns.run(INFECTION_SCRIPT);
}

function setupDashboard(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();
    
        
    const dashboard = new Dashboard(ns, 'Infection', {icon: '🦠', role: 'Launcher'});
    dashboard.initTailTitle();
}
