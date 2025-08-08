import { ServersRepository } from 'workspace/domain/servers/servers.repository';

export function getPayloadTargets(ns: NS): string[] {
    return ServersRepository.getAll(ns)
        .map(x => ServersRepository.get(ns, x))
        .filter(x => x.state.unlocked)
        .map(x => x.name);
}

export function getBestPayloadTarget(ns: NS): string | undefined {
    const targets: string[] = getPayloadTargets(ns);

    const bestProfit = targets.sort((a, b) => hackRatio(ns, a) - hackRatio(ns, b)).pop();
    ns.tprint(`Ratio : ${hackRatio(ns, bestProfit as string)}`)
    return bestProfit;
}

function hackRatio(ns: NS, hostname: string): number {
    return ns.getServerMoneyAvailable(hostname) * ns.hackAnalyze(hostname) / ns.getHackTime(hostname);
}
