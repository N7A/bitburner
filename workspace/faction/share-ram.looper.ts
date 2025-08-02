import * as Log from 'workspace/frameworks/logging';
import * as ExecutionsRepository from 'workspace/domain/executions.repository'

/**
 * Share RAM to faction.
 */
export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);
 
    setupDashboard(ns);

    ns.atExit(() => {
        ExecutionsRepository.remove(ns, ns.getHostname(), ns.pid);
    })
    const startTime = new Date();

    do {
        const shareStartTime = new Date();
        await ns.share();
        const shareEndTime =  new Date();
        refreshDashBoard(ns, startTime, shareStartTime, shareEndTime);
    } while (input.runHasLoop)
}

//#region Input arguments
type InputArg = {
	/** Serveur cible */
	runHasLoop: boolean;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
	return {
		runHasLoop: ns.args[0] ? (ns.args[0] as boolean) : true
	};
}
//#endregion Input arguments

//#region Dashboard
function setupDashboard(ns: NS) {
	ns.disableLog("ALL");
    ns.enableLog("share")
    ns.clearLog();
	
    Log.initTailTitle(ns, 'Share RAM', 'looper', ns.getHostname());
	ns.ui.moveTail(1200, 50);
	
	ns.print('Waiting to share...');
	ns.ui.openTail();
}

function refreshDashBoard(ns: NS, startTime: Date, shareStartTime: Date, shareEndTime: Date) {
    ns.clearLog();
    const shareDuration = new Date(shareEndTime.getTime() - shareStartTime.getTime())
    ns.print(Log.getStartLog());
    ns.print(Log.color("Thread start time : ", Log.Color.MAGENTA), Log.date(ns, startTime));
    ns.print(Log.color("Last share time : ", Log.Color.MAGENTA),  Log.date(ns, shareEndTime));
    ns.print(Log.color("Last share duration : ", Log.Color.MAGENTA),  Log.date(ns, shareDuration));
    ns.print(Log.getEndLog());
}
//#endregion Dashboard