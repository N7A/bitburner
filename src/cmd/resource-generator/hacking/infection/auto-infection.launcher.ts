import * as Referentiel from 'workspace/common/referentiel'
import * as Log from 'workspace/socle/utils/logging';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { Logger } from 'workspace/socle/Logger';

//#region Constants
export const SCAN_SCRIPT = Referentiel.CMD_HACKING_DIRECTORY + '/scan/scan.scheduler.ts';
export const INFECTION_SCRIPT = Referentiel.CMD_HACKING_DIRECTORY + '/infection/infection.scheduler.ts';
//#endregion Constants

export async function main(ns: NS) {
    setupDashboard(ns);

    const logger = new Logger(ns);

    // démarrage du scan
    logger.info(`Start ${Log.action('scan')} execution`);
    ns.run(SCAN_SCRIPT, {preventDuplicates: true});
    
    logger.info(`Start ${Log.action('infection')} execution`);
    ns.run(INFECTION_SCRIPT, {preventDuplicates: true});
}

function setupDashboard(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();
        
    const dashboard = new Dashboard(ns, 'Infection', {icon: '🦠', role: 'Launcher'});
    dashboard.initTailTitle();
}
