import { Daemon } from 'workspace/socle/interface/daemon';
import * as Log from 'workspace/socle/utils/logging';
import { Logger } from 'workspace/socle/Logger';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { DaemonFlags } from 'workspace/common/model/DaemonFlags';

//#region Constantes
const FLAGS_SCHEMA: [string, string | number | boolean | string[]][] = [
    [DaemonFlags.oneshot, false]
];
//#endregion Constantes

let daemon: HackDaemon;

export async function main(ns: NS) {
    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);
    // load input arguments
    const input: InputArg = getInput(ns);
    
    daemon = new HackDaemon(ns, input.targetHost);

    daemon.setupDashboard();

    if (scriptFlags[DaemonFlags.oneshot]) {
        daemon.killAfterLoop();
    }

    await daemon.run();
}


//#region Input arguments
type InputArg = {
    targetHost: string;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
    const logger = new Logger(ns);
    if (ns.args[0] === undefined) {
        logger.err('Merci de renseigner un hostname');
        ns.exit();
    }

    // TODO : print inputs
	return {
		targetHost: (ns.args[0] as string)
	};
}
//#endregion Input arguments

// TODO : a remplacer par port communication
export function killAfterLoop() {
    daemon.killAfterLoop();
}

class HackDaemon extends Daemon {
    private dashboard: Dashboard;
    private targetHost: string;

    constructor(ns: NS, targetHost: string) {
        super(ns);
        
        this.targetHost = targetHost;

        this.dashboard = new Dashboard(ns, `Hack ${Log.target(this.targetHost, {colorless: true})}`, {icon: '👨🏻‍💻💲', role: 'Daemon'});
    }

    async work() {
        await this.ns.hack(this.targetHost)
    }

    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.enableLog('hack');
        this.ns.clearLog();
        
        this.dashboard.initTailTitle();
    }
}