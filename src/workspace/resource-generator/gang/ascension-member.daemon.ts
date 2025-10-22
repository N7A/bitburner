import { Daemon } from 'workspace/socle/interface/daemon';
import * as Log from 'workspace/socle/utils/logging';
import { Logger } from 'workspace/socle/Logger';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { DaemonFlags } from 'workspace/common/model/DaemonFlags';
import { Rank } from 'workspace/resource-generator/gang/model/Rank';

//#region Constantes
const FLAGS_SCHEMA: [string, string | number | boolean | string[]][] = [
    [DaemonFlags.oneshot, false]
];
//#endregion Constantes

let daemon: AscensionMemberDaemon;

/**
 * Share RAM to faction.
 */
export async function main(ns: NS) {
    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);
    // load input arguments
    const input: InputArg = getInput(ns);
 
    daemon = new AscensionMemberDaemon(ns, input.memberName);
    
    daemon.setupDashboard();

    if (scriptFlags[DaemonFlags.oneshot]) {
        daemon.killAfterLoop();
    }

    await daemon.run();
}

//#region Input arguments
type InputArg = {
    memberName: string;
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
        memberName: (ns.args[0] as string)
    };
    
    logger.trace(Log.title('Données d\'entrée'));
    logger.trace(Log.object(input));
    return input;
}
//#endregion Input arguments

// TODO: will not work, find the good way
export function killAfterLoop() {
    daemon.killAfterLoop();
}

class AscensionMemberDaemon extends Daemon {
    private dashboard: Dashboard;
    private memberName: string;

    constructor(ns: NS, memberName: string) {
        super(ns);
        this.memberName = memberName;
        this.dashboard = new Dashboard(ns, `${Log.source(this.memberName, {colorless: true})} Ascend member`, {icon: '🔺', role: 'Daemon'});
    }
    
    async work() {
        // wait purchase to be possible
        while(!this.isAscensionPossible() || !this.isAscensionUseful() || this.isAscensionPainful()) {
            // sleep to prevent crash because of infinite loop
            await this.ns.sleep(500);
        }

        const reputationLost: number = this.ns.gang.getAscensionResult(this.memberName).respect;
        // achat de l'equipement
        this.ns.gang.ascendMember(this.memberName);
        const newName = this.memberName.split('|')[0] + '|' + this.getRankIcon();
        if (newName !== this.memberName) {
            this.ns.gang.renameMember(this.memberName, newName);
            this.memberName = newName;
        }
        this.ns.print(`✨🆙︽ ${this.memberName} ascension ! ✨`);
        this.ns.print(`Respect perdu : ${reputationLost}`);
    }

    isAscensionPossible() {
        const ascensionResult: GangMemberAscension = this.ns.gang.getAscensionResult(this.memberName);

        return ascensionResult !== undefined;
    }

    isAscensionUseful() {
        const ascensionResult: GangMemberAscension = this.ns.gang.getAscensionResult(this.memberName);
        // TODO: parametrage
        const minFactor: number = 1

        return ascensionResult 
            && (
                ascensionResult.agi > minFactor
                || ascensionResult.cha > minFactor
                || ascensionResult.def > minFactor
                || ascensionResult.dex > minFactor
                || ascensionResult.hack > minFactor
                || ascensionResult.str > minFactor
            )
    }

    isAscensionPainful() {
        // TODO: membre sur a une tache en cours importante
        // TODO: reputation nécessaire (perdu après ascension)
        // TODO: équipement non rentabilisé (perdu après ascension)

        return false;
    }

    getAscensionMultiplcateurAverage(): number {
        return (this.ns.gang.getMemberInformation(this.memberName).agi_asc_mult
        + this.ns.gang.getMemberInformation(this.memberName).cha_asc_mult
        + this.ns.gang.getMemberInformation(this.memberName).def_asc_mult
        + this.ns.gang.getMemberInformation(this.memberName).dex_asc_mult
        + this.ns.gang.getMemberInformation(this.memberName).hack_asc_mult
        + this.ns.gang.getMemberInformation(this.memberName).str_asc_mult) / 6
    }

    getRankIcon(): string {
        const average = this.getAscensionMultiplcateurAverage();
        if (average <= 0) {
            return Rank.STAGIAIRE.icon;
        } else if (
            average > 0
            && average < 1
        ) {
            return Rank.JUNIOR.icon;
        } else if (
            average >= 1
            && average < 2
        ) {
            return Rank.CONFIRME.icon;
        } else if (
            average >= 2
            && average < 3
        ) {
            return Rank.SENIOR.icon;
        } else if (
            average >= 3
        ) {
            return Rank.EXPERT.icon;
        }
    }

    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
        
        this.dashboard.initTailTitle();
    }
}