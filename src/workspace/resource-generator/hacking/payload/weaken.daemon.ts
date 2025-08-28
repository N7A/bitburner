import { Daemon } from 'workspace/socle/interface/daemon';
import * as Log from 'workspace/socle/utils/logging';
import { TerminalLogger } from 'workspace/socle/TerminalLogger';

let daemon: WeakenDaemon;

export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);

    // TODO : add to input
    // INFO : getServerMinSecurityLevel aussi cher que get depuis la bdd
    const securityThresh = ns.getServerMinSecurityLevel(input.targetHost);

    daemon = new WeakenDaemon(ns, input.targetHost, securityThresh);
    
    daemon.setupDashboard();

    if (!input.runHasLoop) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();
}

//#region Input arguments
type InputArg = {
    targetHost: string;
	runHasLoop: boolean;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
    const logger = new TerminalLogger(ns);
    if (ns.args[0] === undefined) {
        logger.err('Merci de renseigner un hostname');
        ns.exit();
    }

	return {
		targetHost: (ns.args[0] as string),
		runHasLoop: ns.args[1] !== undefined ? (ns.args[1] as boolean) : true
	};
}
//#endregion Input arguments

export function killAfterLoop() {
    daemon.killAfterLoop();
}

class WeakenDaemon extends Daemon {
    private targetHost: string;
    private securityThresh: number;

    constructor(ns: NS, targetHost: string, securityThresh: number) {
        super(ns);
        
        this.targetHost = targetHost;
        this.securityThresh = securityThresh;
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
        
        Log.initTailTitle(this.ns, `Weaken ${Log.targetColorLess(this.targetHost)}`, 'Daemon');
    }
    //#endregion Dashboard
}