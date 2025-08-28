import * as Log from 'workspace/socle/logging';
import { Daemon } from 'workspace/common/daemon';
import { TerminalLogger } from 'workspace/common/TerminalLogger';

let daemon: GrowDaemon;

export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);

    // load host data
    // INFO : getServerMaxMoney aussi cher que get depuis la bdd
    const moneyThresh = ns.getServerMaxMoney(input.targetHost)

    if (moneyThresh === 0) {
        ns.tprint('WARN', ' ', '[', input.targetHost, '] ', 'No money in there')
        ns.exit()
    }
    
    daemon = new GrowDaemon(ns, input.targetHost, moneyThresh);
    
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

	return {
		targetHost: (ns.args[0] as string),
		runHasLoop: ns.args[1] !== undefined ? (ns.args[1] as boolean) : true
	};
}
//#endregion Input arguments

export function killAfterLoop() {
    daemon.killAfterLoop();
}

class GrowDaemon extends Daemon {
    private targetHost: string;
    private moneyThresh: number;

    constructor(ns: NS, targetHost: string, moneyThresh: number) {
        super(ns);

        this.targetHost = targetHost;
        this.moneyThresh = moneyThresh;
    }
    
    async work() {
        const currentMoney = this.ns.getServerMoneyAvailable(this.targetHost);
        this.ns.print(Log.threshold(this.ns, currentMoney, this.moneyThresh));
        if (currentMoney < this.moneyThresh) {        
            //const threadNeeded = ns.growthAnalyze(targetHost, moneyThresh - currentMoney);
            //const avaliableRam: number = ns.getServerMaxRam(targetHost) - ns.getServerUsedRam(targetHost);
            const nbThreads = 1//Math.min(threadNeeded, avaliableRam / 0.15);
            
            // If the server's security level is above our threshold, weaken it
            await this.ns.grow(this.targetHost, {threads:nbThreads});
        } else {
            await this.ns.asleep(500);
        }
    }

    //#region Dashboard
    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.enableLog('grow');
        this.ns.clearLog();
        
        Log.initTailTitle(this.ns, `Grow ${Log.targetColorLess(this.targetHost)}`, 'Daemon');
    }
    //#endregion Dashboard

}