export async function main(ns: NS) {
    ns.disableLog('getHostname')
    ns.disableLog('getServerMinSecurityLevel')
    ns.disableLog('getServerSecurityLevel')

    //#region input parameters
    var targetHost: string = ns.args.length >= 1 ? ns.args[0] as string : ns.getHostname()
    //#endregion input parameters

    const securityThresh = ns.getServerMinSecurityLevel(targetHost);

    while(true) {
        ns.print('----------');
        const currentSecurityLevel = ns.getServerSecurityLevel(targetHost);
        if (currentSecurityLevel > securityThresh) {
            ns.print(ns.formatNumber(currentSecurityLevel) + ' >>> ' + ns.formatNumber(securityThresh) + ' (' + ns.formatNumber(currentSecurityLevel - securityThresh) + ')');
            // If the server's security level is above our threshold, weaken it
            await ns.weaken(targetHost);
        } else {
            ns.print('SUCCESS', ' ', 'Threshold OK (' + ns.formatNumber(currentSecurityLevel) + ')');
            await ns.asleep(500);
        }
    }
}