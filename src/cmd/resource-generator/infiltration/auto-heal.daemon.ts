import { Daemon } from 'workspace/socle/interface/daemon';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { DaemonFlags } from 'workspace/common/model/DaemonFlags';

//#region Constantes
const FLAGS_SCHEMA: [string, string | number | boolean | string[]][] = [
    [DaemonFlags.oneshot, false]
];
//#endregion Constantes

export async function main(ns: NS) {
    // singleton
    const script: RunningScript | null = ns.getRunningScript('cmd/resource-generator/infiltration/auto-heal.daemon.ts');
    if (script) {
        ns.kill(script.pid);
    }

    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);

    const daemon: AutoHealDaemon = new AutoHealDaemon(ns);
    
    daemon.setupDashboard();

    if (scriptFlags[DaemonFlags.oneshot]) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();
    
    ns.ui.closeTail();
}

class AutoHealDaemon extends Daemon {

    private dashboard: Dashboard;
    
    constructor(ns: NS) {
        super(ns);
        
        this.dashboard = new Dashboard(ns, 'Auto-heal', {icon: '🏥', role: 'daemon'});
    }

    async work(): Promise<any> {
        // TODO: prise en compte piggy bank
        // TODO: si pas assez d'argent pour heal -> alert
        // TODO: hospitalize cut game -> ? (alert impossible avec timer du jeu) -> hospitalize si killed after one loose
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
