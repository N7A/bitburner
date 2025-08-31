import * as Log from 'workspace/socle/utils/logging';
import { Logger } from 'workspace/socle/Logger';
import { ServersService } from 'workspace/servers/servers.service';

export async function main(ns: NS, scanTarget: string) {
    // load input arguments
    const input: InputArg = getInput(ns, scanTarget);
    
    const backdoorServerWorker = new BackdoorServerWorker(ns, input.targetHost);

    backdoorServerWorker.setupDashboard();

    await backdoorServerWorker.work();
}

//#region Input arguments
type InputArg = {
    /** Serveur cible */
    targetHost: string;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS, targetHost: string): InputArg {
    const logger = new Logger(ns);
    if (!targetHost) {
        if (ns.args[0] === undefined) {
            logger.err('Merci de renseigner un hostname');
            ns.exit();
        }
        targetHost = ns.args[0] as string
    }
    let result: InputArg = {
        targetHost: (targetHost ?? ns.getHostname()) as string
    };

    return result;
}
//#endregion Input arguments

class BackdoorServerWorker {
    private ns: NS;
    private targetHostname: string;
    private serversService: ServersService;

    constructor(ns: NS, targetHostname: string) {
        this.ns = ns;
        this.targetHostname = targetHostname;
        this.serversService = new ServersService(ns);
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
            
        Log.initTailTitle(this.ns, `Backdoor ${Log.target(this.targetHostname, {colorless: true})}`, 'Worker');
    }
}