import { ServersService } from 'workspace/servers/servers.service';

export function getPayloadTargets(ns: NS): string[] {
    return ServersService.getAllHackable(ns);
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
