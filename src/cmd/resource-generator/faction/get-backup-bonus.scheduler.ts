import { Dashboard } from 'workspace/socle/interface/dashboard';
import { Daemon } from 'workspace/socle/interface/daemon';
import { Logger } from 'workspace/socle/Logger';

/**
 * @requires singularity
 * @param ns 
 */
export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);

    const daemon = new GetBackupBonus(ns);
    
    daemon.setupDashboard();

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
        runHasLoop: ns.args[0] !== undefined ? (ns.args[0] as boolean) : false
    };
}
//#endregion Input arguments

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
            this.logger.success(`${this.dashboard.icon} Backup bonus claim !`);
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