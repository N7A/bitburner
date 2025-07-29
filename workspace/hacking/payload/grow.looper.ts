import {TargetHost, HackData} from 'workspace/hacking/model/TargetHost'
import {get as ServersRepositoryGet } from 'workspace/domain/servers/servers.repository';

export async function main(ns: NS) {
    ns.disableLog('getHostname')
    ns.disableLog('getServerMaxMoney')
    ns.disableLog('getServerMoneyAvailable')

    //#region input parameters
    var targetHost: string = ns.args.length >= 1 ? ns.args[0] as string : ns.getHostname()
    //#endregion input parameters

    // load host data
    //const data: TargetHost|null = ServersRepositoryGet(ns, targetHost);
    //const hackData: HackData|undefined = data?.hackData

    const moneyThresh = ns.getServerMaxMoney(targetHost)//hackData?.moneyMax as number;

    if (moneyThresh === 0) {
        ns.tprint('WARN', ' ', '[', targetHost, '] ', 'No money in there')
        ns.exit()
    }
    
    while(true) {
        ns.print('----------');
        const currentMoney = ns.getServerMoneyAvailable(targetHost);
        if (currentMoney < moneyThresh) {
            ns.print(ns.formatNumber(currentMoney) + ' / ' + ns.formatNumber(moneyThresh) + ' (' + ns.formatNumber(moneyThresh - currentMoney) + ')');
            
            //const threadNeeded = ns.growthAnalyze(targetHost, moneyThresh - currentMoney);
            //const avaliableRam: number = ns.getServerMaxRam(targetHost) - ns.getServerUsedRam(targetHost);
            const nbThreads = 1//Math.min(threadNeeded, avaliableRam / 0.15);
            
            // If the server's security level is above our threshold, weaken it
            await ns.grow(targetHost, {threads:nbThreads});
        } else {
            ns.print('SUCCESS', ' ', 'Threshold OK (' + ns.formatNumber(currentMoney) + ')');
            await ns.asleep(500);
        }
    }
}