import { TaskType } from "workspace/resource-generator/gang/domain/TaskType";

export function getTargetTask(ns: NS, type: TaskType): GangTaskStats[] {
    const tasks = getAvailableTask(ns);

    if (type === TaskType.DOWN_WANTED) {
        return tasks
            .filter(x => x.baseWanted < 0)
            .sort((a, b) => a.baseWanted - b.baseWanted);
    } else if (type === TaskType.UP_MONEY) {
        return tasks
            .filter(x => x.baseMoney < 0)
            .sort((a, b) => b.baseMoney - a.baseMoney);
    } else if (type === TaskType.UP_REPUTATION) {
        return tasks
            .filter(x => x.baseRespect < 0)
            .sort((a, b) => b.baseRespect - a.baseRespect);
    } else if (type === TaskType.UP_STAT) {
        return tasks;
    }

    return tasks;
}

function getAvailableTask(ns: NS): GangTaskStats[] {
    return ns.gang.getTaskNames()
            .map(x => ns.gang.getTaskStats(x))
            .filter(x => (ns.gang.getGangInformation().isHacking && x.isHacking) 
                || (!ns.gang.getGangInformation().isHacking && x.isCombat));
}