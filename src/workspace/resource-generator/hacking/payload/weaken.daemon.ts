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

let daemon: WeakenDaemon;

export async function main(ns: NS) {
    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);
    // load input arguments
    const input: InputArg = getInput(ns);

    daemon = new WeakenDaemon(ns, input.targetHost, input.securityThresh);
    
    daemon.setupDashboard();

    if (scriptFlags[DaemonFlags.oneshot]) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();
}

//#region Input arguments
type InputArg = {
    targetHost: string;
    securityThresh: number;
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

    logger.trace(Log.title('Arguments'));
    logger.trace(ns.args?.toString());

	const input = {
		targetHost: (ns.args[0] as string),
		securityThresh: (ns.args[1] as number)
	};

    logger.trace(Log.title('Données d\'entrée'));
    logger.trace(Log.object(input));
    return input;
}
//#endregion Input arguments

export function killAfterLoop() {
    daemon.killAfterLoop();
}

class WeakenDaemon extends Daemon {
    private dashboard: Dashboard;
    private targetHost: string;
    private securityThresh: number;

    constructor(ns: NS, targetHost: string, securityThresh: number) {
        super(ns);
        
        this.targetHost = targetHost;
        this.securityThresh = securityThresh;
        this.dashboard = new Dashboard(ns, `Weaken ${Log.target(this.targetHost, {colorless: true})}`, {icon: '📉🔒', role: 'Daemon'});
    }

    async work() {
        const currentSecurityLevel = this.ns.getServerSecurityLevel(this.targetHost);
        this.ns.print(Log.threshold(this.ns, currentSecurityLevel, this.securityThresh));
        // If security level too high
        if (currentSecurityLevel > this.securityThresh) {
            await this.ns.weaken(this.targetHost);
        } else {
            await this.ns.asleep(500);
        }
    }
    
    //#region Dashboard
    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.enableLog('weaken');
        this.ns.clearLog();
        
        this.dashboard.initTailTitle();
    }
    //#endregion Dashboard
}