import { Daemon } from 'workspace/socle/interface/daemon';
import * as Log from 'workspace/socle/utils/logging';
import { GangDirectiveRepository } from 'workspace/resource-generator/gang/domain/GangDirective.repository';
import { getBestEmployee, getRepartitionEmployee, getTargetTask } from 'workspace/resource-generator/gang/task.selector';
import { GangDirective } from 'workspace/resource-generator/gang/domain/model/GangDirective';
import { WantedLvl } from 'workspace/resource-generator/gang/domain/model/WantedLvl';
import { TaskType } from 'workspace/resource-generator/gang/model/TaskType';
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

class Main extends Daemon {
    private dashboard: Dashboard;
    private gangDirectiveRepository: GangDirectiveRepository;

    constructor(ns: NS) {
        // waitNewTargets = true : no targets
        super(ns)

        this.gangDirectiveRepository = new GangDirectiveRepository(ns);
        this.dashboard = new Dashboard(ns, 'Gang task', {icon: '🏴‍☠️📋', role: 'Scheduler'});
        this.setupDashboard();
    }

    async work(): Promise<any> {
        const gangDirective: GangDirective = this.gangDirectiveRepository.get();
        let availableMembers: string[] = this.ns.gang.getMemberNames();

        // TODO: vérifier si guerre de gang en cours, adapter en consequence
        if(gangDirective.wantedLvl == WantedLvl.LOWEST) {
            for (const member in availableMembers) {
                this.assignTask(TaskType.DOWN_WANTED, [member]);
            }
            return;
        }

        // TODO: wait wanted to lowest THEN set wantedLvl 0/s + do new repartition

        const availableMembersNumber = (gangDirective.wantedLvl == WantedLvl.ZERO_BY_SECOND) ? 
            Math.floor(availableMembers.length / 2) : availableMembers.length;
        const taskRepartition: Map<TaskType, number> = getRepartitionEmployee(this.ns, availableMembersNumber);

        // utiliser le meilleur membre en priorité à la tache la plus importante
        const taskTypes = Array.from((gangDirective.tasksWeight as Map<TaskType, number>).keys())
            .sort((a, b) => taskRepartition.get(b) - taskRepartition.get(a));
        
        for (const taskType of taskTypes) {
            this.ns.tprint(Log.getStartLog());
            this.ns.tprint('Task type : ', taskType);
            for(let i=0; i < taskRepartition.get(taskType) ; i++) {
                const bestTask: GangTaskStats = this.assignTask(taskType, availableMembers);

                this.ns.tprint('-----');

                // TODO: adapt en fonction du wanted réel avec le membre
                // compenser le wanted de la tache
                if (bestTask.baseWanted > 0 && gangDirective.wantedLvl == WantedLvl.ZERO_BY_SECOND) {
                    this.assignTask(TaskType.DOWN_WANTED, availableMembers);
                }
            }
            this.ns.tprint(Log.getEndLog());
        }

        // TODO: wait directives change || ascension || equip change (stat or number)
    }

    assignTask(taskType: TaskType, availableMembers: string[]): GangTaskStats {
        // TODO: influance territoire sur le business

        // sort tasks
        const tasks: GangTaskStats[] = getTargetTask(this.ns, taskType);
        // select best task
        const bestTask: GangTaskStats = tasks.shift();
        this.ns.tprint('Best task : ', bestTask.name);
        // select member
        const bestEmployee = getBestEmployee(this.ns, availableMembers, bestTask?.name ?? '').pop();
        this.ns.tprint('Best employee : ', bestEmployee);
        // TODO: if emp can't do task (difficutlty + stat) get next best task
        // TODO: if no task possible found task upstat THEN retry later
        // assign
        availableMembers.splice(availableMembers.indexOf(bestEmployee), 1);
        this.ns.gang.setMemberTask(bestEmployee, bestTask.name);

        return bestTask;
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