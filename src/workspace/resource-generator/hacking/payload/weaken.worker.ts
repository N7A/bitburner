import * as Log from 'workspace/socle/utils/logging';
import { Logger } from 'workspace/socle/Logger';
import { Dashboard } from 'workspace/socle/interface/dashboard';

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
    const logger = new Logger(ns);
    if (ns.args[0] === undefined) {
        logger.err('Merci de renseigner un hostname');
        ns.exit();
    }

    logger.trace(Log.title('Arguments'));
    logger.trace(ns.args?.toString());

	const input = {
		targetHost: (ns.args[0] as string)
	};
    
    logger.trace(Log.title('Données d\'entrée'));
    logger.trace(Log.object(input));
    return input;
}
//#endregion Input arguments

//#region Dashboard
function setupDashboard(ns: NS, input: InputArg) {
    ns.disableLog("ALL");
    ns.enableLog('weaken');
    ns.clearLog();
    
    const dashboard: Dashboard = new Dashboard(ns, `Weaken ${Log.target(input.targetHost, {colorless: true})}`, {icon: '📉🔒', role: 'Worker'});
    dashboard.initTailTitle();
}
//#endregion Dashboard
