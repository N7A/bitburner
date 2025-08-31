import { Headhunter } from 'workspace/socle/interface/headhunter';
import * as Log from 'workspace/socle/utils/logging';
import { MemberNamesService } from 'workspace/resource-generator/gang/MemberNamesService';
import { GANG_LOGO } from 'workspace/resource-generator/gang/application-properties';
import { Dashboard } from 'workspace/socle/interface/dashboard';

/**
 * Cartographie et enregistre les données des serveurs du réseau.
 */
export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);

    const daemon = new Main(ns);
    
    if (!input.runHasLoop) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();

    ns.ui.closeTail();
}

//#region Input arguments
type InputArg = {
    /** Serveur cible */
    runHasLoop: boolean;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
    return {
        runHasLoop: ns.args[0] ? (ns.args[0] as boolean) : false
    };
}
//#endregion Input arguments

class Main extends Headhunter<string> {
    readonly EQUIP_SCRIPT = 'workspace/resource-generator/gang/equip-member.daemon.ts';
    readonly ASCENSION_SCRIPT = 'workspace/resource-generator/gang/ascension-member.daemon.ts';
    private memberNamesService: MemberNamesService;
    private dashboard: Dashboard;

    constructor(ns: NS) {
        // waitNewTargets = true : no targets
        super(ns, true)
        this.setupDashboard();

        this.memberNamesService = new MemberNamesService(ns);
        this.dashboard = new Dashboard(ns, 'Recruit', {icon: '🥊🫵', role: 'Scheduler'});
    }

    async work(targets: string[]): Promise<any> {
        const recruitsAvailable: number = this.ns.gang.getRecruitsAvailable();
        if (recruitsAvailable > 0) {
            // select name
            const newMember = this.memberNamesService.getNextName();

            this.ns.gang.recruitMember(newMember);
            const role = 'larbin'
            const resumeParcour = '{parcour à alimenter}'
            this.ns.print(`✨ ${GANG_LOGO}🆕🔰 ${newMember} recruitment ! ✨`);
            this.ns.tprint(this.getMailDeBienvenue(newMember, role, resumeParcour));
            
            // TODO: new employee guide
            // training, equip, give task
            // TODO: use load balancer
            this.ns.run(this.EQUIP_SCRIPT, 1, newMember);
            this.ns.run(this.ASCENSION_SCRIPT, 1, newMember);
        }
    }

    private getMailDeBienvenue(newMember: string, role: string, resumeParcour: string) {
        return `${GANG_LOGO}\n`
            + `Bonjour à toutes et à tous,\n
                J'ai le plaisir de vous annoncer le recrutement en CDI de ${newMember} en tant que ${role} au sein du gang à compter de ${new Date().toDateString()}.\n
                ${resumeParcour}\n\n
                Nous sommes ravis de son arrivée et lui souhaitons la bienvenue parmi nous !`
            + `\n${GANG_LOGO}`
    }
    
    isKillConditionReached(): boolean {
        // gang size limit reached
        return this.ns.gang.respectForNextRecruit() === Infinity;
    }

    //#region Dashboard
    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
        
        this.dashboard.initTailTitle();
        this.ns.ui.openTail();
    }
    //#endregion Dashboard
}