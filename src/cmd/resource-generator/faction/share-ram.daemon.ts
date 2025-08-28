import { Daemon } from 'workspace/common/daemon';
import * as Log from 'workspace/socle/logging';

let daemon: Daemon;

/**
 * Share RAM to faction.
 */
export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);
 
    setupDashboard(ns, input);

    if (!input.runHasLoop) {
        daemon.killAfterLoop();
    }

    daemon = new ShareRamDaemon(ns);
    
    await daemon.run();
}

//#region Input arguments
type InputArg = {
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

//#region Dashboard
function setupDashboard(ns: NS, input: InputArg) {
    ns.disableLog("ALL");
    ns.enableLog('share');
    ns.clearLog();
    
    Log.initTailTitle(ns, `Share`, 'Daemon');
    ns.print(Log.title('Données d\'entrée'));
    ns.print(Log.object(input));
}
//#endregion Dashboard

// TODO: will not work, find the good way
export function killAfterLoop() {
    daemon.killAfterLoop();
}

class ShareRamDaemon extends Daemon {
    constructor(ns: NS) {
        super(ns);
    }
    
    async work() {
        await this.ns.share();
    }

}