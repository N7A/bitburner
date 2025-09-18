import { Daemon } from 'workspace/socle/interface/daemon';
import { Dashboard } from 'workspace/socle/interface/dashboard';

export async function main(ns: NS) {
    // singleton
    const script: RunningScript | null = ns.getRunningScript('cmd/resource-generator/infiltration/auto-heal.daemon.ts');
    if (script) {
        ns.kill(script.pid);
    }

    // load input arguments
    const input: InputArg = getInput(ns);

    const daemon: AutoHealDaemon = new AutoHealDaemon(ns);
    
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
        runHasLoop: ns.args[0] !== undefined ? (ns.args[0] as boolean) : true
    };
}
//#endregion Input arguments

class AutoHealDaemon extends Daemon {

    private dashboard: Dashboard;
    
    constructor(ns: NS) {
        super(ns);
        
        this.dashboard = new Dashboard(ns, 'Auto-heal', {icon: '🏥', role: 'daemon'});
    }

    async work(): Promise<any> {
        // TODO: prise en compte piggy bank
        // TODO: si pas assez d'argent pour heal -> alert
        // TODO: hospitalize cut game -> ? (alert impossible avec timer du jeu)
        // TODO: => notif nombre de lose autorisé avant infiltration + hospitalize
        if (this.ns.getPlayer().hp.current < this.ns.getPlayer().hp.max) {
            this.ns.singularity.hospitalize();
        }
    }

    //#region Dashboard
    setupDashboard() {
        this.ns.disableLog('ALL');
        this.ns.clearLog();
        
        this.dashboard.initTailTitle();
        this.ns.ui.openTail();
    }
    //#endregion Dashboard
}
