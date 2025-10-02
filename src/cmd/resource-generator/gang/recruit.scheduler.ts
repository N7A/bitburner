import { Headhunter } from 'workspace/socle/interface/headhunter';
import { MemberNamesService } from 'workspace/resource-generator/gang/MemberNamesService';
import { GANG_LOGO } from 'workspace/resource-generator/gang/application-properties';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { DaemonFlags } from 'workspace/common/model/DaemonFlags';

//#region Constantes
const FLAGS_SCHEMA: [string, string | number | boolean | string[]][] = [
    [DaemonFlags.oneshot, false]
];
//#endregion Constantes

/**
 * Cartographie et enregistre les données des serveurs du réseau.
 */
export async function main(ns: NS) {
    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);

    const daemon = new Main(ns);
    
    if (scriptFlags[DaemonFlags.oneshot]) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();

    ns.ui.closeTail();
}

class Main extends Headhunter<string> {
    readonly EQUIP_SCRIPT = 'workspace/resource-generator/gang/equip-member.daemon.ts';
    readonly ASCENSION_SCRIPT = 'workspace/resource-generator/gang/ascension-member.daemon.ts';
    private memberNamesService: MemberNamesService;
    private dashboard: Dashboard;

    constructor(ns: NS) {
        // waitNewTargets = true : no targets
        super(ns, true)

        this.memberNamesService = new MemberNamesService(ns);
        this.dashboard = new Dashboard(ns, 'Recruit', {icon: '🥊🫵', role: 'Scheduler'});
        this.setupDashboard();
    }

    async work(targets: string[]): Promise<any> {
        const recruitsAvailable: number = this.ns.gang.getRecruitsAvailable();
        if (recruitsAvailable > 0) {
            // select name
            const newMember = this.memberNamesService.getNextName();

            this.ns.gang.recruitMember(newMember + '|' + Rank.STAGIAIRE.icon);
            const role = Rank.STAGIAIRE.name.toLowerCase();
            const resumeParcour = '{parcour à alimenter}'
            this.ns.print(`✨ ${GANG_LOGO}🆕🔰 ${newMember} recruitment ! ✨`);
            this.ns.tprint(this.getMailDeBienvenue(newMember, role, resumeParcour));
            
            // TODO: new employee guide
            // training, equip, give task
            // TODO: use load balancer
            this.ns.run(this.EQUIP_SCRIPT, {preventDuplicates: true}, newMember);
            this.ns.run(this.ASCENSION_SCRIPT, {preventDuplicates: true}, newMember);
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