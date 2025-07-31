import * as Log from 'workspace/frameworks/logging'
import * as ExecutionsRepository from 'workspace/domain/executions.repository'

/**
 * Share RAM to faction.
 */
export async function main(ns: NS) {    
    setupDashboard(ns);

    ns.atExit(() => {
        ExecutionsRepository.remove(ns, ns.getHostname(), ns.pid);
    })
    const startTime = new Date();

    while (true) {
        const shareStartTime = new Date();
        await ns.share();
        const shareEndTime =  new Date();
        refreshDashBoard(ns, startTime, shareStartTime, shareEndTime);
    }
}

/** @param {import(".").NS } ns */
function setupDashboard(ns: NS) {
	ns.disableLog("ALL");
    ns.enableLog("share")
    ns.clearLog();
	
	ns.ui.openTail();
	ns.ui.setTailTitle(`[${ns.getHostname()}] Share RAM`);
	ns.ui.moveTail(1200, 50);
	
	ns.print('Waiting to share...');
}

/** @param {import(".").NS } ns */
function refreshDashBoard(ns: NS, startTime: Date, shareStartTime: Date, shareEndTime: Date) {
    ns.clearLog();
    const shareDuration = new Date(shareEndTime.getTime() - shareStartTime.getTime())
    ns.print(Log.getStartLog());
    ns.print(Log.color("Thread start time : ", Log.Color.MAGENTA), startTime.toLocaleTimeString());
    ns.print(Log.color("Last share time : ", Log.Color.MAGENTA),  shareEndTime.toLocaleTimeString());
    ns.print(Log.color("Last share duration : ", Log.Color.MAGENTA),  shareDuration.toLocaleTimeString());
    ns.print(Log.getEndLog());
}
