import { Daemon } from 'workspace/common/daemon';
import * as Log from 'workspace/frameworks/logging';

let daemon: Daemon;

export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);

    setupDashboard(ns, input);

    // TODO : add to input
    // INFO : getServerMinSecurityLevel aussi cher que get depuis la bdd
    const securityThresh = ns.getServerMinSecurityLevel(input.targetHost);

    if (!input.runHasLoop) {
        await work(ns, input, securityThresh);
        return;
    }

    daemon = new Daemon(ns, () => work(ns, input, securityThresh));
    
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
    if (ns.args[0] === undefined) {
        ns.tprint('ERROR', ' ', 'Merci de renseigner un hostname');
        ns.exit();
    }

	return {
		targetHost: (ns.args[0] as string),
		runHasLoop: ns.args[1] !== undefined ? (ns.args[1] as boolean) : true
	};
}
//#endregion Input arguments

//#region Dashboard
function setupDashboard(ns: NS, input: InputArg) {
    ns.disableLog("ALL");
    ns.enableLog('weaken');
    ns.clearLog();
    
    Log.initTailTitle(ns, `Weaken ${Log.targetColorLess(input.targetHost)}`, 'Daemon');
}
//#endregion Dashboard

async function work(ns: NS, input: InputArg, securityThresh: number) {
    const currentSecurityLevel = ns.getServerSecurityLevel(input.targetHost);
    ns.print(Log.threshold(ns, currentSecurityLevel, securityThresh));
    // If security level too high
    if (currentSecurityLevel > securityThresh) {
        await ns.weaken(input.targetHost);
    } else {
        await ns.asleep(500);
    }
}

export function killAfterLoop() {
    daemon.killAfterLoop();
}