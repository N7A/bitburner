export function getReduceWantedTask(ns: NS): GangTaskStats | undefined {
    return ns.gang.getTaskNames()
            .map(x => ns.gang.getTaskStats(x))
            .filter(x => (ns.gang.getGangInformation().isHacking && x.isHacking) 
                || (!ns.gang.getGangInformation().isHacking && x.isCombat))
            .filter(x => x.baseWanted < 0)
            .sort((a, b) => a.baseWanted - b.baseWanted)
            .shift();
}