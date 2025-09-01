import { ServersService } from 'workspace/servers/servers.service';

export function getPayloadTargets(ns: NS): string[] {
    const serversService = new ServersService(ns);
    return serversService.getAllHackable();
}

export function getBestPayloadTarget(ns: NS): string | undefined {
    const targets: string[] = getPayloadTargets(ns);

    const bestProfit = targets.sort((a, b) => hackRatio(ns, a) - hackRatio(ns, b)).pop();
    ns.tprint(`Ratio : ${hackRatio(ns, bestProfit as string)}`)
    // TODO: prendre en compte current money
    return bestProfit;
}

function hackRatio(ns: NS, hostname: string): number {
    return ns.getServerMoneyAvailable(hostname) * ns.hackAnalyze(hostname) / ns.getHackTime(hostname);
}
