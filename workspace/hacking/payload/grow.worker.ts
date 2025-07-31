import * as Log from 'workspace/frameworks/logging'

export async function main(ns: NS) {
    //#region input parameters
    var targetHost: string = ns.args.length >= 1 ? ns.args[0] as string : ns.getHostname();
    //#endregion input parameters
    
    setupDashboard(ns, targetHost);
    
    ns.print(Log.getStartLog());
    ns.print(Log.date(ns, new Date()));
    
    await ns.grow(targetHost);

    ns.print(Log.getEndLog());
}

/** @param {import(".").NS } ns */
function setupDashboard(ns: NS, targetHost: string) {
    ns.clearLog();
	
	ns.ui.setTailTitle(`[${ns.getHostname()}] Grow -> ${targetHost}`);
}