export function getAvailableEquipements(ns: NS): string[] {
    return ns.gang.getEquipmentNames()
            .map(x => ns.gang.getEquipmentType(x))
            .filter(x => ns.gang.getEquipmentType(x) === 'upgrade');
}

export function getBestEquipement(ns: NS, equipement: string[], task: string): string[] {
    const taskData = ns.gang.getTaskStats(task);

    return equipement
        .sort((a, b) => {
            const mappedA = ns.gang.getEquipmentStats(a);
            const mappedB = ns.gang.getEquipmentStats(a);
            return (taskData.agiWeight * mappedA.agi
            + taskData.chaWeight * mappedA.cha
            + taskData.defWeight * mappedA.def
            + taskData.dexWeight * mappedA.dex
            + taskData.hackWeight * mappedA.hack
            + taskData.strWeight * mappedA.str)
            - (taskData.agiWeight * mappedB.agi
            + taskData.chaWeight * mappedB.cha
            + taskData.defWeight * mappedB.def
            + taskData.dexWeight * mappedB.dex
            + taskData.hackWeight * mappedB.hack
            + taskData.strWeight * mappedB.str)
        });
}
