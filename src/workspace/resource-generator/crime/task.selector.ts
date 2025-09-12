import { TaskType } from "workspace/resource-generator/crime/model/TaskType";
import { PlayerStatType } from "workspace/resource-generator/crime/model/PlayerStatType";

export function getTargetTask(ns: NS, type: TaskType, skillWeight?: Map<PlayerStatType, number>): CrimeType[] {
    const tasks = getAvailableTask(ns);

    if (type == TaskType.UP_MONEY) {
        return tasks
            .sort((a, b) => getProduction(ns, ns.singularity.getCrimeStats(b).money, b) * ns.singularity.getCrimeChance(b) 
                - getProduction(ns, ns.singularity.getCrimeStats(a).money, a) * ns.singularity.getCrimeChance(a));
    } else if (type == TaskType.DOWN_KARMA) {
        return tasks
            .sort((a, b) => ns.singularity.getCrimeStats(b).karma - ns.singularity.getCrimeStats(a).karma);
    } else if (type == TaskType.UP_STAT) {
        let getGeneralExp = (crime: CrimeType) => {
            const crimeStats = ns.singularity.getCrimeStats(crime)
            return crimeStats.agility_exp * skillWeight.get(PlayerStatType.AGILITY)
                + crimeStats.charisma_exp * skillWeight.get(PlayerStatType.CHARISMA)
                + crimeStats.defense_exp * skillWeight.get(PlayerStatType.DEFENSE)
                + crimeStats.dexterity_exp * skillWeight.get(PlayerStatType.DEXTERITY)
                + crimeStats.hacking_exp * skillWeight.get(PlayerStatType.HACKING)
                + crimeStats.strength_exp * skillWeight.get(PlayerStatType.STRENGTH)
        };

        return tasks
            .sort((a, b) => getProduction(ns, getGeneralExp(b), b) 
                - getProduction(ns, getGeneralExp(a), a));
    }

    return tasks;
}

export function getTaskToUpChance(ns: NS, crimeToUp: CrimeType) {
    const crimeStats = ns.singularity.getCrimeStats(crimeToUp);

    let skillWeight: Map<PlayerStatType, number> = new Map();
    skillWeight.set(PlayerStatType.AGILITY, crimeStats.agility_success_weight);
    skillWeight.set(PlayerStatType.CHARISMA, crimeStats.charisma_success_weight);
    skillWeight.set(PlayerStatType.DEFENSE, crimeStats.defense_success_weight);
    skillWeight.set(PlayerStatType.DEXTERITY, crimeStats.dexterity_success_weight);
    skillWeight.set(PlayerStatType.HACKING, crimeStats.hacking_success_weight);
    skillWeight.set(PlayerStatType.STRENGTH, crimeStats.strength_success_weight);

    return getTargetTask(ns, TaskType.UP_STAT, skillWeight);
}

// TODO: use repository pour reduire la RAM
function getAvailableTask(ns: NS): CrimeType[] {
    return Array.from(new Set(Object.values(ns.enums.CrimeType)));
}

const getProduction = (ns: NS, gain: number, crime: CrimeType): number => gain / (ns.singularity.getCrimeStats(crime).time / 1000);
