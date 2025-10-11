import * as Log from 'workspace/socle/utils/logging';
import { Daemon } from 'workspace/socle/interface/daemon';
import { Logger } from 'workspace/socle/Logger';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { DaemonFlags } from 'workspace/common/model/DaemonFlags';

//#region Constantes
const FLAGS_SCHEMA: [string, string | number | boolean | string[]][] = [
    [DaemonFlags.oneshot, false],
    [DaemonFlags.threads, 1]
];
//#endregion Constantes

let daemon: GrowDaemon;

export async function main(ns: NS) {
    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);
    // load input arguments
    const input: InputArg = getInput(ns);

    if (input.moneyThresh === 0) {
        ns.tprint('WARN', ' ', '[', input.targetHost, '] ', 'No money in there')
        ns.exit()
    }
    
    daemon = new GrowDaemon(ns, input.targetHost, input.moneyThresh, (scriptFlags[DaemonFlags.threads] as number));
    
    daemon.setupDashboard();

    if (scriptFlags[DaemonFlags.oneshot]) {
        daemon.killAfterLoop();
    }

    await daemon.run();
}

//#region Input arguments
type InputArg = {
    targetHost: string;
    moneyThresh: number;
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
		targetHost: (ns.args[0] as string),
		moneyThresh: (ns.args[1] as number)
	};
    
    logger.trace(Log.title('Données d\'entrée'));
    logger.trace(Log.object(input));
    return input;
}
//#endregion Input arguments

export function killAfterLoop() {
    daemon.killAfterLoop();
}

class GrowDaemon extends Daemon {
    private dashboard: Dashboard;
    private targetHost: string;
    private moneyThresh: number;
    private nbThreads: number;

    constructor(ns: NS, targetHost: string, moneyThresh: number, nbThreads: number = 1) {
        super(ns);

        this.targetHost = targetHost;
        this.moneyThresh = moneyThresh;
        this.nbThreads = nbThreads;
        
        this.dashboard = new Dashboard(
            ns, 
            `Grow ${Log.target(this.targetHost, {colorless: true})}${this.nbThreads > 1 ? ' x' + this.nbThreads : ''}`, 
            {icon: '📈💲', role: 'Daemon'}
        );
    }
    
    async work() {
        const currentMoney = this.ns.getServerMoneyAvailable(this.targetHost);
        this.ns.print(Log.threshold(this.ns, currentMoney, this.moneyThresh));
        if (currentMoney < this.moneyThresh) {
            await this.ns.grow(this.targetHost, {threads:this.nbThreads});
        } else {
            await this.ns.asleep(500);
        }
    }

    //#region Dashboard
    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.enableLog('grow');
        this.ns.clearLog();
        
        this.dashboard.initTailTitle();
    }
    //#endregion Dashboard

}