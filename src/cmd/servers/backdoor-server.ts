import * as Log from 'workspace/socle/utils/logging';
import { Logger } from 'workspace/socle/Logger';
import { ServersRepository } from 'workspace/servers/domain/servers.repository'
import { ServersService } from 'workspace/servers/servers.service';
import { Dashboard } from 'workspace/socle/interface/dashboard';

/**
 * @requires singularity
 * @param ns 
 * @param scanTarget 
 * 
 * @remarks RAM cost: 7.95 GB
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
    private logger: Logger
    private targetHostname: string;
    private serversService: ServersService;
    private dashboard: Dashboard;

    constructor(ns: NS, targetHostname: string) {
        this.ns = ns;
        this.logger = new Logger(ns);
        this.targetHostname = targetHostname;
        this.serversService = new ServersService(ns);
        this.dashboard = new Dashboard(ns, `Backdoor ${Log.target(this.targetHostname, {colorless: true})}`, {icon: '🚪', role: 'Worker'});
    }

    async work() {
        // check if backdoor already installed
        if (this.ns.getServer(this.targetHostname).backdoorInstalled) {
            this.logger.warn(`Backdoor already installed on ${this.targetHostname}`);
            return
        }
        // check if connect target host currently possible
        if (!this.serversService.isHostConnectionPossible(this.targetHostname)) {
            this.logger.err(`Backdoor currently impossible to install on ${this.targetHostname}`);
            return
        }

        // get host path to target host
        const hostPath: string[] = this.serversService.getHostPath(this.targetHostname);

        // target host connection
        hostPath.forEach(currentHost => {
            this.ns.singularity.connect(currentHost);
            if (this.targetHostname !== currentHost) {
                this.ns.singularity.installBackdoor();
            }
        });
        
        // backdoor intallation
        await this.ns.singularity.installBackdoor();

        // go back home
        this.ns.singularity.connect('home');
    }

    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
            
        this.dashboard.initTailTitle();
    }
}