import * as Log from 'workspace/socle/utils/logging';
import { TerminalLogger } from 'workspace/socle/TerminalLogger';
import { Alert } from 'workspace/notification/alert';

/**
 * Alerte quand le joueur atteint un certain monant.
 * @param ns Bitburner API
 */
export async function main(ns: NS) {
    const input: InputArg = getInput(ns);

    const main: MoneyAmountAlert = new MoneyAmountAlert(ns, input.threshold);
    
    await main.run();
}

//#region Input parameters
type InputArg = {
    /** Montant surveillé */
    threshold: number;
}

/**
 * Load input parameters
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
    const logger = new TerminalLogger(ns);
    if (ns.args[0] === undefined) {
        logger.err('Merci de renseigner un montant à notifier');
        ns.exit();
    }
    
    return {
        threshold: (ns.args[0] as number)
    };
}
//#endregion Input parameters

class MoneyAmountAlert extends Alert {
    private threshold: number;

    constructor(ns: NS, threshold: number) {
        super(ns);
        this.threshold = threshold;
    }

    refreshDashboard(): void {
        const secondRestantes = (this.threshold - this.ns.getPlayer().money) / this.getCurrentProduction();
        this.ns.print(secondRestantes / 60, ' minutes avant d\'atteindre $', Log.money(this.ns, this.threshold));
    }

    waitingEvent(): boolean {
        return this.ns.getPlayer().money >= this.threshold;
    }

    getAlertMessage(): string {
        return 'Montant ' + Log.money(this.ns, this.threshold);
    }
    
    private getCurrentProduction() {
        const numNodes = this.ns.hacknet.numNodes();
        let hacknetProduction: number = 0;
        for (let i = 0; i < numNodes; i++) {
            hacknetProduction += this.ns.hacknet.getNodeStats(i).production;
        }

        return this.ns.getTotalScriptIncome()[0] + hacknetProduction
    }
}