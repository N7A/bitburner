import * as Log from 'workspace/frameworks/logging';
import { Daemon } from 'workspace/common/daemon';
import { TerminalLogger } from 'workspace/common/TerminalLogger';

let daemon: Daemon;

export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);

    setupDashboard(ns, input);

    // load host data
    // INFO : getServerMaxMoney aussi cher que get depuis la bdd
    const moneyThresh = ns.getServerMaxMoney(input.targetHost)

    if (moneyThresh === 0) {
        ns.tprint('WARN', ' ', '[', input.targetHost, '] ', 'No money in there')
        ns.exit()
    }
    
    if (!input.runHasLoop) {
        await work(ns, input, moneyThresh);
        return;
    }

    daemon = new Daemon(ns, () => work(ns, input, moneyThresh));
    
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

//#region Dashboard
function setupDashboard(ns: NS, input: InputArg) {
    ns.disableLog("ALL");
    ns.enableLog('grow');
    ns.clearLog();
    
    Log.initTailTitle(ns, `Grow ${Log.targetColorLess(input.targetHost)}`, 'Daemon');
    ns.print(Log.title('Données d\'entrée'));
    ns.print(Log.object(input));
}
//#endregion Dashboard

async function work(ns: NS, input: InputArg, moneyThresh: number) {
    const currentMoney = ns.getServerMoneyAvailable(input.targetHost);
    ns.print(Log.threshold(ns, currentMoney, moneyThresh));
    if (currentMoney < moneyThresh) {        
        //const threadNeeded = ns.growthAnalyze(targetHost, moneyThresh - currentMoney);
        //const avaliableRam: number = ns.getServerMaxRam(targetHost) - ns.getServerUsedRam(targetHost);
        const nbThreads = 1//Math.min(threadNeeded, avaliableRam / 0.15);
        
        // If the server's security level is above our threshold, weaken it
        await ns.grow(input.targetHost, {threads:nbThreads});
    } else {
        await ns.asleep(500);
    }
}

export function killAfterLoop() {
    daemon.killAfterLoop();
}