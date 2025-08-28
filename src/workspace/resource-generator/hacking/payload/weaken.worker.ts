import * as Log from 'workspace/socle/utils/logging';
import { TerminalLogger } from 'workspace/socle/TerminalLogger';

export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);

    setupDashboard(ns, input);

    await ns.weaken(input.targetHost);
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
    const logger = new TerminalLogger(ns);
    if (ns.args[0] === undefined) {
        logger.err('Merci de renseigner un hostname');
        ns.exit();
    }

	return {
		targetHost: (ns.args[0] as string)
	};
}
//#endregion Input arguments

//#region Dashboard
function setupDashboard(ns: NS, input: InputArg) {
    ns.disableLog("ALL");
    ns.enableLog('weaken');
    ns.clearLog();
    
    Log.initTailTitle(ns, `Weaken ${Log.targetColorLess(input.targetHost)}`, 'Worker');
}
//#endregion Dashboard
