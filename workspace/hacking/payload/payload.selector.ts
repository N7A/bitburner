/**
 * bestHackFitTarget
 */
export async function main(ns: NS, hostnames: string[]) {
    // TODO save on repository
    const bestProfit = hostnames.sort((a, b) => hackRatio(ns, a) - hackRatio(ns, b)).pop();
    ns.tprint(`Ratio : ${hackRatio(ns, bestProfit as string)}`)
    return bestProfit;
}

function hackRatio(ns: NS, hostname: string): number {
    return ns.getServerMoneyAvailable(hostname) * ns.hackAnalyze(hostname) / ns.getHackTime(hostname);
}
