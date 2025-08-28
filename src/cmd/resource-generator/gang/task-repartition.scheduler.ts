import { Daemon } from 'workspace/common/daemon';
import * as Log from 'workspace/frameworks/logging';
import { GangDirectiveRepository } from 'workspace/resource-generator/gang/domain/GangDirective.repository';
import { getBestEmployee, getRepartitionEmployee, getTargetTask } from 'workspace/resource-generator/gang/task.selector';
import { GangDirective } from 'workspace/resource-generator/gang/domain/model/GangDirective';
import { WantedLvl } from 'workspace/resource-generator/gang/domain/model/WantedLvl';
import { TaskType } from 'workspace/resource-generator/gang/model/TaskType';

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

class Main extends Daemon {
    private gangDirectiveRepository: GangDirectiveRepository;

    constructor(ns: NS) {
        // waitNewTargets = true : no targets
        super(ns)

        this.gangDirectiveRepository = new GangDirectiveRepository(ns);
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

        const taskRepartition: Map<TaskType, number> = getRepartitionEmployee(this.ns, availableMembers.length);

        // utiliser le meilleur membre en priorité à la tache la plus importante
        const taskTypes = Array.from((gangDirective.tasksWeight as Map<TaskType, number>).keys())
            .sort((a, b) => taskRepartition.get(b) - taskRepartition.get(a));
        
        for (const taskType of taskTypes) {
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
        }

        // TODO: wait directives change || ascension || equip change (stat or number)
    }

    assignTask(taskType: TaskType, availableMembers: string[]): GangTaskStats {
        // sort tasks
        const tasks: GangTaskStats[] = getTargetTask(this.ns, taskType);
        // select best task
        const bestTask: GangTaskStats = tasks.shift();
        this.ns.tprint('Best task : ', bestTask);
        // select member
        const bestEmployee = getBestEmployee(this.ns, availableMembers, bestTask?.name ?? '').pop();
        this.ns.tprint('Best employee : ', bestEmployee);
        // TODO: if emp can't do task (difficutlty + stat) get next best task
        // TODO: if no task possible found task upstat THEN retry later
        // assign
        availableMembers = availableMembers.filter(x => x !== bestEmployee);
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
        
        Log.initTailTitle(this.ns, 'Gang task', 'Scheduler');
        this.ns.ui.openTail();
    }
    //#endregion Dashboard
}