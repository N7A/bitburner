import { Daemon } from 'workspace/socle/interface/daemon';
import * as Log from 'workspace/socle/utils/logging';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { DaemonFlags } from 'workspace/common/model/DaemonFlags';
import { Logger } from 'workspace/socle/Logger';

//#region Constantes
const FLAGS_SCHEMA: [string, string | number | boolean | string[]][] = [
    [DaemonFlags.oneshot, false]
];
//#endregion Constantes

let daemon: Daemon;

/**
 * Share RAM to faction.
 */
export async function main(ns: NS) {
    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);
 
    setupDashboard(ns);

    if (scriptFlags[DaemonFlags.oneshot]) {
        daemon.killAfterLoop();
    }

    daemon = new ShareRamDaemon(ns);
    
    await daemon.run();
}

//#region Dashboard
function setupDashboard(ns: NS) {
    ns.disableLog("ALL");
    ns.enableLog('share');
    ns.clearLog();
    
    const dashboard: Dashboard = new Dashboard(ns, `Share`, {icon: '♻️⚡️', role: 'Daemon'});
    dashboard.initTailTitle();
    const logger = new Logger(ns);
    logger.trace(Log.title('Arguments'));
    logger.trace(ns.args?.toString());
    logger.trace(Log.title('Flags'));
    logger.trace(JSON.stringify(ns.flags(FLAGS_SCHEMA)));
}
//#endregion Dashboard

// TODO: will not work, find the good way
export function killAfterLoop() {
    daemon.killAfterLoop();
}

class ShareRamDaemon extends Daemon {
    constructor(ns: NS) {
        super(ns);
    }
    
    async work() {
        await this.ns.share();
    }

}