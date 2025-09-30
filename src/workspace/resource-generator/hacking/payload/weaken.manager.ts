import { Daemon } from 'workspace/socle/interface/daemon';
import * as Log from 'workspace/socle/utils/logging';
import { waitEndExecution } from 'workspace/socle/utils/execution';
import { Logger } from 'workspace/socle/Logger';
import { Dashboard } from 'workspace/socle/interface/dashboard';

let daemon: WeakenManager;

const WORKER_SCRIPT = 'workspace/resource-generator/hacking/payload/weaken.worker.ts';

export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);

    // TODO : add to input
    // INFO : getServerMinSecurityLevel aussi cher que get depuis la bdd
    const securityThresh = ns.getServerMinSecurityLevel(input.targetHost);

    daemon = new WeakenManager(ns, input.targetHost, securityThresh, input.threadAmount);
    
    daemon.setupDashboard();

    if (!input.runHasLoop) {
        daemon.killAfterLoop();
    }

    await daemon.run();
}

//#region Input arguments
type InputArg = {
    targetHost: string;
    threadAmount: number;
	runHasLoop: boolean;
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

	return {
		targetHost: (ns.args[0] as string),
        threadAmount: ns.args[1] !== undefined ? (ns.args[0] as number) : 1,
		runHasLoop: ns.args[2] !== undefined ? (ns.args[2] as boolean) : true
	};
}
//#endregion Input arguments

export function killAfterLoop() {
    daemon.killAfterLoop();
}

class WeakenManager extends Daemon {
    private dashboard: Dashboard;
    private targetHost: string;
    private securityThresh: number;
    private threadAmount: number;

    constructor(ns: NS, targetHost: string, securityThresh: number, threadAmount: number) {
        super(ns);

        this.targetHost = targetHost;
        this.securityThresh = securityThresh;
        this.threadAmount = threadAmount;

        this.dashboard = new Dashboard(ns, `Weaken ${Log.target(targetHost, {colorless: true})}`, {icon: '📉🔒', role: 'manager'});
    }

    async work() {
        const currentSecurityLevel = this.ns.getServerSecurityLevel(this.targetHost);
        this.ns.print(Log.threshold(this.ns, currentSecurityLevel, this.securityThresh));
        // If security level too high
        if (currentSecurityLevel > this.securityThresh) {
            var pid: number = this.ns.run(WORKER_SCRIPT, this.threadAmount, this.targetHost);
            await waitEndExecution(this.ns, pid);
        } else {
            await this.ns.asleep(500);
        }
    }

    //#region Dashboard
    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.enableLog('weaken');
        this.ns.clearLog();
        
        this.dashboard.initTailTitle();
    }
    //#endregion Dashboard

}