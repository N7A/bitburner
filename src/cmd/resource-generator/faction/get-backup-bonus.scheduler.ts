import { Dashboard } from 'workspace/socle/interface/dashboard';
import { Daemon } from 'workspace/socle/interface/daemon';
import { Logger } from 'workspace/socle/Logger';
import { DaemonFlags } from 'workspace/common/model/DaemonFlags';

//#region Constantes
const FLAGS_SCHEMA: [string, string | number | boolean | string[]][] = [
    [DaemonFlags.oneshot, false]
];
//#endregion Constantes

/**
 * @requires singularity
 * @param ns 
 */
export async function main(ns: NS) {
    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);

    const daemon = new GetBackupBonus(ns);
    
    daemon.setupDashboard();

    if (scriptFlags[DaemonFlags.oneshot]) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();

    ns.ui.closeTail();
}

class GetBackupBonus extends Daemon {
    private dashboard: Dashboard;
    private logger: Logger

    constructor(ns: NS) {
        super(ns)
        this.dashboard = new Dashboard(ns, 'Backup bonus looting', {icon: '🎁', role: 'Scheduler'});
		this.logger = new Logger(ns);
    }

    async work(): Promise<any> {
        if(this.ns.singularity.exportGameBonus()) {
            this.ns.singularity.exportGame();
            this.logger.success(`${this.dashboard.icon} Backup bonus claimed !`);
        }
    }

    //#region Dashboard
    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
        
        this.dashboard.initTailTitle();
        this.ns.ui.openTail();
    }
    //#endregion Dashboard
}