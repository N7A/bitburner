import { Daemon } from 'workspace/common/daemon';
import * as Log from 'workspace/frameworks/logging';

let daemon: Daemon;

export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);
    
    setupDashboard(ns, input);

    if (!input.runHasLoop) {
        await work(ns, input);
        return;
    }

    daemon = new Daemon(ns, () => work(ns, input));
    
    await daemon.run();
}


async function work(ns: NS, input: InputArg) {
    await ns.hack(input.targetHost)
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

    // TODO : print inputs
	return {
		targetHost: (ns.args[0] as string),
		runHasLoop: ns.args[1] !== undefined ? (ns.args[1] as boolean) : true
	};
}
//#endregion Input arguments

//#region Dashboard
function setupDashboard(ns: NS, input: InputArg) {
    ns.disableLog("ALL");
    ns.enableLog('hack');
    ns.clearLog();
    
    Log.initTailTitle(ns, `Hack ${Log.targetColorLess(input.targetHost)}`, 'Daemon');
    ns.print(Log.title('Données d\'entrée'));
    ns.print(Log.object(input));
}
//#endregion Dashboard

// TODO : a remplacer par port communication
export function killAfterLoop() {
    daemon.killAfterLoop();
}