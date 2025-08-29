import { Daemon } from 'workspace/socle/interface/daemon';
import * as Log from 'workspace/socle/utils/logging';
import { TerminalLogger } from 'workspace/socle/TerminalLogger';

let daemon: AscensionMemberDaemon;

/**
 * Share RAM to faction.
 */
export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);
 
    daemon = new AscensionMemberDaemon(ns, input.memberName);
    
    daemon.setupDashboard();

    if (!input.runHasLoop) {
        daemon.killAfterLoop();
    }

    await daemon.run();
}

//#region Input arguments
type InputArg = {
    memberName: string;
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
        memberName: (ns.args[0] as string),
		runHasLoop: ns.args[1] !== undefined ? (ns.args[1] as boolean) : true
    };
}
//#endregion Input arguments

// TODO: will not work, find the good way
export function killAfterLoop() {
    daemon.killAfterLoop();
}

class AscensionMemberDaemon extends Daemon {
    private memberName: string;

    constructor(ns: NS, memberName: string) {
        super(ns);
        this.memberName = memberName;
    }
    
    async work() {
        // wait purchase to be possible
        while(!this.isAscensionPossible() || !this.isAscensionUseful() || this.isAscensionPainful()) {
            // sleep to prevent crash because of infinite loop
            await this.ns.sleep(500);
        }

        // achat de l'equipement
        this.ns.gang.ascendMember(this.memberName);
        this.ns.print(`✨🆙 ${this.memberName} ascension ✨ !`);
    }

    isAscensionPossible() {
        const ascensionResult: GangMemberAscension = this.ns.gang.getAscensionResult(this.memberName);

        return ascensionResult !== undefined;
    }

    isAscensionUseful() {
        const ascensionResult: GangMemberAscension = this.ns.gang.getAscensionResult(this.memberName);
        // TODO: parametrage
        const minFactor: number = 0

        return ascensionResult 
            && (
                ascensionResult.agi > minFactor
                || ascensionResult.cha > minFactor
                || ascensionResult.def > minFactor
                || ascensionResult.dex > minFactor
                || ascensionResult.hack > minFactor
                || ascensionResult.respect > minFactor
                || ascensionResult.str > minFactor
            )
    }

    isAscensionPainful() {
        // TODO: membre sur a une tache en cours importante
        // TODO: reputation nécessaire (perdu après ascension)
        // TODO: équipement non rentabilisé (perdu après ascension)

        return false;
    }

    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
        
        Log.initTailTitle(this.ns, 'Ascend member', 'Daemon', this.memberName);
    }
}