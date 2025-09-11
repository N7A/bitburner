import * as Log from 'workspace/socle/utils/logging';
import { ServersRepository } from 'workspace/servers/domain/servers.repository'
import { ServersService } from 'workspace/servers/servers.service';
import { Dashboard } from 'workspace/socle/interface/dashboard';

/**
 * @requires singularity
 * @param ns 
 * @param scanTarget 
 */
export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = await getInput(ns);
    
    const backdoorServerWorker = new BackdoorServerWorker(ns, input.targetHostname);

    backdoorServerWorker.setupDashboard();

    await backdoorServerWorker.work();
}

//#region Input arguments
type InputArg = {
    /** Serveur cible */
    targetHostname: string;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
async function getInput(ns: NS): Promise<InputArg> {
    let targetHostname: string;
    if (ns.args[0] === undefined) {
        const repository = new ServersRepository(ns);
        
        targetHostname = await ns.prompt('Merci de renseigner un hostname', { type: "select", choices: repository.getAllIds() }) as string
    } else {
        targetHostname = (ns.args[0] as string);
    }

    return {
        targetHostname: targetHostname
    };
}
//#endregion Input arguments

class BackdoorServerWorker {
    private ns: NS;
    private targetHostname: string;
    private serversService: ServersService;
    private dashboard: Dashboard;

    constructor(ns: NS, targetHostname: string) {
        this.ns = ns;
        this.targetHostname = targetHostname;
        this.serversService = new ServersService(ns);
        this.dashboard = new Dashboard(ns, `Backdoor ${Log.target(this.targetHostname, {colorless: true})}`, {icon: '🚪', role: 'Worker'});
    }

    async work() {
        // check if connect target host currently possible
        if (this.serversService.isHostConnectionPossible(this.targetHostname)) {
            // get host path to target host
            const hostPath: string[] = this.serversService.getHostPath(this.targetHostname);

            // target host connection
            hostPath.forEach(x => this.ns.singularity.connect(x));
            
            // backdoor intallation
            await this.ns.singularity.installBackdoor();

            // go back home
            this.ns.singularity.connect('home');
        }
    }

    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
            
        this.dashboard.initTailTitle();
    }
}