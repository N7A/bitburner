import { Daemon } from 'workspace/common/daemon';
import * as Log from 'workspace/socle/logging';
import { TerminalLogger } from 'workspace/common/TerminalLogger';

let daemon: HackDaemon;

export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);
    
    daemon = new HackDaemon(ns, input.targetHost);

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

    // TODO : print inputs
	return {
		targetHost: (ns.args[0] as string),
		runHasLoop: ns.args[1] !== undefined ? (ns.args[1] as boolean) : true
	};
}
//#endregion Input arguments

// TODO : a remplacer par port communication
export function killAfterLoop() {
    daemon.killAfterLoop();
}

class HackDaemon extends Daemon {
    private targetHost: string;

    constructor(ns: NS, targetHost: string) {
        super(ns);
        
        this.targetHost = targetHost;
    }

    async work() {
        await this.ns.hack(this.targetHost)
    }

    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.enableLog('hack');
        this.ns.clearLog();
        
        Log.initTailTitle(this.ns, `Hack ${Log.targetColorLess(this.targetHost)}`, 'Daemon');
    }
}