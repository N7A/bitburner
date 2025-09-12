import { Daemon } from 'workspace/socle/interface/daemon';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { ServersService } from 'workspace/servers/servers.service';

export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);

    const daemon: WaitAndSeeRamDaemon = new WaitAndSeeRamDaemon(ns, input.threshold);
    
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
    threshold: number;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
    return {
        runHasLoop: ns.args[0] !== undefined ? (ns.args[0] as boolean) : true,
        threshold: ns.args[1] !== undefined ? (ns.args[1] as number) : 0
    };
}
//#endregion Input arguments

// TODO: remplacer par un broker + commande d'alerte sur la queue + retour d'alerte sur une queue retour 
// -> multicommande sur un dameon unique
export class WaitAndSeeRamDaemon extends Daemon {
    private dashboard: Dashboard;
    private serversService: ServersService;
    private threshold: number;

    constructor(ns: NS, threshold: number) {
        super(ns);
        
        this.dashboard = new Dashboard(ns, `Wait 'n' see - ${threshold} RAM`, {icon: '⏳', role: 'daemon'});
        this.serversService = new ServersService(ns);
        this.threshold = threshold;
    }

    isKillConditionReached(): boolean {
        return this.getRamDisponible() >= this.threshold;
    }

    getRamDisponible() {
        return this.serversService.getAllExecutable()
                .map(x => this.ns.getServerMaxRam(x))
                .reduce((a,b) => a+b);
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