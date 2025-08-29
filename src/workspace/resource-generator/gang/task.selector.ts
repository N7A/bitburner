import { GangDirectiveRepository } from "workspace/resource-generator/gang/domain/GangDirective.repository";
import { TaskType } from "workspace/resource-generator/gang/model/TaskType";

export function getTargetTask(ns: NS, type: TaskType): GangTaskStats[] {
    const tasks = getAvailableTask(ns);

    if (type == TaskType.DOWN_WANTED) {
        return tasks
            .filter(x => x.baseWanted < 0)
            .sort((a, b) => a.baseWanted - b.baseWanted);
    } else if (type == TaskType.UP_MONEY) {
        return tasks
            .filter(x => x.baseMoney > 0)
            .sort((a, b) => b.baseMoney - a.baseMoney);
    } else if (type == TaskType.UP_REPUTATION) {
        return tasks
            .filter(x => x.baseRespect > 0)
            .sort((a, b) => b.baseRespect - a.baseRespect);
    } else if (type == TaskType.UP_STAT) {
        return ["Train Combat", "Train Hacking", "Train Charisma"].map(x => ns.gang.getTaskStats(x));
    } else if (type == TaskType.POWER_TERRITORY) {
        return ["Territory Warfare"].map(x => ns.gang.getTaskStats(x));
    }

    return tasks;
}

function getAvailableTask(ns: NS): GangTaskStats[] {
    return ns.gang.getTaskNames()
            .map(x => ns.gang.getTaskStats(x))
            .filter(x => (ns.gang.getGangInformation().isHacking && x.isHacking) 
                || (!ns.gang.getGangInformation().isHacking && x.isCombat));
}

export function getRepartitionEmployee(ns: NS, employeeNumber: number): Map<TaskType, number> {
    const gangDirectiveRepository: GangDirectiveRepository = new GangDirectiveRepository(ns);
    const weightByTask = (gangDirectiveRepository.get().tasksWeight as Map<TaskType, number>);

    let tasks: TaskType[] = [];
    let totalWeight: number = 0;
    // filter zero weight
    weightByTask.forEach((value: number, key: TaskType) => {
        if (
            value <= 0
            // démobilisation pour éviter les morts
            || key == TaskType.POWER_TERRITORY && ns.gang.getGangInformation().territoryWarfareEngaged
        ) {
            return;
        }
        
        tasks.push(key);
        totalWeight += value;
    });

    const employeeByTask: Map<TaskType, number> = new Map<TaskType, number>();
    for(const task of tasks) {
        const employeeToCurrentTask = Math.max(1, Math.floor(employeeNumber * (weightByTask.get(task) / totalWeight)));
        employeeByTask.set(task, employeeToCurrentTask);
    };

    return employeeByTask;
}

export function getBestEmployeeFormulas(ns: NS, member: string[], task: string, taskType: TaskType): string[] {
    if (ns.ls('home').includes('Formulas.exe')) {
        const gangInformation: GangGenInfo = ns.gang.getGangInformation();
        const taskStat: GangTaskStats = ns.gang.getTaskStats(task);

        if (taskType == TaskType.UP_MONEY) {
            return member.map(x => ns.gang.getMemberInformation(x))
                // filter task not possible
                .filter(x => ns.formulas.gang.moneyGain(gangInformation, x, taskStat) > 0)
                .sort((a, b) => {
                    return ns.formulas.gang.moneyGain(gangInformation, a, taskStat) 
                        - ns.formulas.gang.moneyGain(gangInformation, b, taskStat);
                })
                .map(x => x.name);
        } else if (taskType == TaskType.UP_REPUTATION) {
            return member.map(x => ns.gang.getMemberInformation(x))
                // filter task not possible
                .filter(x => ns.formulas.gang.respectGain(gangInformation, x, taskStat) > 0)
                .sort((a, b) => {
                    return ns.formulas.gang.respectGain(gangInformation, a, taskStat) 
                        - ns.formulas.gang.respectGain(gangInformation, b, taskStat);
                })
                .map(x => x.name);
        } else if (taskType == TaskType.DOWN_WANTED) {
            return member.map(x => ns.gang.getMemberInformation(x))
                // filter task not possible
                .filter(x => ns.formulas.gang.wantedLevelGain(gangInformation, x, taskStat) < 0)
                .sort((a, b) => {
                    return ns.formulas.gang.wantedLevelGain(gangInformation, b, taskStat) 
                        - ns.formulas.gang.wantedLevelGain(gangInformation, a, taskStat);
                })
                .map(x => x.name);
        }
    }
    
    return getBestEmployee(ns, member, task);
}

export function getBestEmployee(ns: NS, member: string[], task: string): string[] {
    const taskData = ns.gang.getTaskStats(task);

    return member.map(x => ns.gang.getMemberInformation(x))
        .sort((a, b) => {
            return (taskData.agiWeight * a.agi
            + taskData.chaWeight * a.cha
            + taskData.defWeight * a.def
            + taskData.dexWeight * a.dex
            + taskData.hackWeight * a.hack
            + taskData.strWeight * a.str)
            - (taskData.agiWeight * b.agi
            + taskData.chaWeight * b.cha
            + taskData.defWeight * b.def
            + taskData.dexWeight * b.dex
            + taskData.hackWeight * b.hack
            + taskData.strWeight * b.str)
        })
        // TODO: filter task not possible (difficulty ?)
        .map(x => x.name);
}

export function getBestEmployeeToTrain(ns: NS, member: string[], task: string): string[] {
    const taskData = ns.gang.getTaskStats(task);

    return member.map(x => ns.gang.getMemberInformation(x))
        .sort((a, b) => {
            return (taskData.agiWeight * a.agi_asc_mult * a.agi_mult
            + taskData.chaWeight * a.cha_asc_mult * a.cha_mult
            + taskData.defWeight * a.def_asc_mult * a.def_mult
            + taskData.dexWeight * a.dex_asc_mult * a.dex_mult
            + taskData.hackWeight * a.hack_asc_mult * a.hack_mult
            + taskData.strWeight * a.str_asc_mult * a.str_mult)
            - (taskData.agiWeight * b.agi_asc_mult * b.agi_mult
            + taskData.chaWeight * b.cha_asc_mult * b.cha_mult
            + taskData.defWeight * b.def_asc_mult * b.def_mult
            + taskData.dexWeight * b.dex_asc_mult * b.dex_mult
            + taskData.hackWeight * b.hack_asc_mult * b.hack_mult
            + taskData.strWeight * b.str_asc_mult * b.str_mult)
        })
        .map(x => x.name);
}
