import * as Referentiel from 'workspace/referentiel'
import {TargetHost, HackData} from 'workspace/hacking/model/TargetHost'
import{getAvailableServer} from 'workspace/load-balancer/main'
import {ExecutionParameters} from 'workspace/load-balancer/model/ExecutionServer'
import * as TargetsRepository from 'workspace/domain/targets/targets.repository';
import * as ServersRepository from 'workspace/domain/servers/servers.repository';
import * as Log from 'workspace/logging-framework/main'

/**
 * Augmente au maximum l'argent disponible sur un serveur,
 * puis réduit au minimum la sécurité,
 * puis lance les runners de grow, weaken et hack.
 */
export async function main(ns: NS) {
    //#region input parameters
    var targetHost: string = ns.args.length >= 1 ? ns.args[0] as string : ns.getHostname()
    //#endregion input parameters

    setupDashboard(ns, targetHost);

    // load host data
    const data: TargetHost|null = ServersRepository.get(ns, targetHost);
    const hackData: HackData = data!.hackData

    //#region Setup
    ns.print(`${Log.date(ns, new Date())} - ${Log.color('Starting Weaken', Log.Color.CYAN)}`);
    await runScriptUntilEnoughThread(ns, targetHost, hackData, Referentiel.HACKING_DIRECTORY + '/payload/weaken.worker.ts', getWeakenNeededThreads)
    
    ns.print(`${Log.date(ns, new Date())} - `, 'SUCCESS', ' ', 'Weaken done');

    const moneyThresh = hackData.moneyMax as number;
    if (moneyThresh > 0) {
        ns.print(`${Log.date(ns, new Date())} - ${Log.color('Starting Grow', Log.Color.CYAN)}`);
        await growToMax(ns, targetHost, hackData);
        ns.print(`${Log.date(ns, new Date())} - `, 'SUCCESS', ' ', 'Grow done');
    }
    //#endregion Setup

    TargetsRepository.addHack(ns, targetHost)
    ns.run(Referentiel.HACKING_DIRECTORY + '/payload/payload.launcher.ts');

    ns.print(`${Log.date(ns, new Date())} - ${Log.color('Payload launched', Log.Color.CYAN)}`);
}

function setupDashboard(ns: NS, targetHost: string) {
	ns.disableLog("ALL");
    ns.clearLog();
	
	ns.ui.openTail();
	ns.ui.setTailTitle(`Setup payload > ${targetHost} <`);
	ns.ui.moveTail(1200, 50);
	ns.print(Log.INFO('Start time', Log.date(ns, new Date())));
	ns.print(`${Log.date(ns, new Date())} - `, 'INFO', ' ', 'Waiting to setup...');
}

function refreshGrowDashBoard(ns: NS, neededGrowThread: number, possibleGrowThread: number) {
    ns.print(Log.INFO('Needed thread', ns.formatNumber(neededGrowThread, 0)));
    ns.print(Log.INFO('Available thread', ns.formatNumber(possibleGrowThread, 0)));
}

async function growToMax(ns: NS, targetHost: string, hackData: HackData) {
    const scriptFilepath = Referentiel.HACKING_DIRECTORY + '/payload/grow.worker.ts';
    const ramCost = ns.getScriptRam(scriptFilepath);

    let neededThread = Math.ceil(getGrowthNeededThreads(ns, targetHost, hackData));
    
    ns.print(Log.getStartLog());
    while(neededThread > 0) {
        const availableServer: ExecutionParameters = getAvailableServer(ns, ramCost, neededThread);
        refreshGrowDashBoard(ns, neededThread, availableServer.nbThread);
        const threadToLaunch = Math.min(neededThread, availableServer.nbThread);
        if (threadToLaunch > 0) {
            ns.print('----------')
            // execute grow with max threads possible
            let pidExecution = ns.exec(scriptFilepath, availableServer.hostname, threadToLaunch, targetHost);
            // on attend la fin du grow
            ns.print(`${Log.date(ns, new Date())} - `, 'INFO', ' ', `Waiting ${scriptFilepath.substring(scriptFilepath.lastIndexOf('/'), scriptFilepath.lastIndexOf('.ts'))} on {${availableServer.hostname}}...`);
            while (pidExecution != 0 && ns.isRunning(pidExecution)) {
                await ns.asleep(500)
            }
            // maj needed threads
            neededThread = Math.floor(getGrowthNeededThreads(ns, targetHost, hackData));
            
            // TODO : run weaken in same time
            await runScriptUntilEnoughThread(ns, targetHost, hackData, Referentiel.HACKING_DIRECTORY + '/payload/weaken.worker.ts', getWeakenNeededThreads);
        } else {
            await ns.asleep(500)
        }
    }
    ns.print(Log.getEndLog());
}

async function runScriptUntilEnoughThread(
    ns: NS, 
    targetHost: string, 
    hackData: HackData, 
    scriptFilepath: string, 
    getNeededThreads: (ns: NS, targetHost: string, hackData: HackData) => number
) {
    let neededThread = Math.ceil(getNeededThreads(ns, targetHost, hackData));
    const ramCost = ns.getScriptRam(scriptFilepath);
    
    ns.print(Log.getStartLog());
    while(neededThread > 0) {
        const availableServer: ExecutionParameters = getAvailableServer(ns, ramCost, neededThread);
        refreshGrowDashBoard(ns, neededThread, availableServer.nbThread);
        const threadToLaunch = Math.min(neededThread, availableServer.nbThread);
        if (threadToLaunch > 0) {
            ns.print('----------')
            // execute grow with max threads possible
            let pidExecution = ns.exec(scriptFilepath, availableServer.hostname, threadToLaunch, targetHost);
            // on attend la fin du grow
            ns.print(`${Log.date(ns, new Date())} - `, 'INFO', ' ', `Waiting ${scriptFilepath.substring(scriptFilepath.lastIndexOf('/'), scriptFilepath.lastIndexOf('.ts'))} on {${availableServer.hostname}}...`)
            while (pidExecution != 0 && ns.isRunning(pidExecution)) {
                await ns.asleep(500)
            }
            // maj needed threads
            neededThread = Math.floor(getNeededThreads(ns, targetHost, hackData));
        } else {
            await ns.asleep(500)
        }
    }
    ns.print(Log.getEndLog());
}

const getGrowthNeededThreads = (ns: NS, targetHost: string, hackData: HackData) => {
    const currentMoney = ns.getServerMoneyAvailable(targetHost) + 1;
    return ns.growthAnalyze(targetHost, Math.ceil(hackData.moneyMax as number / currentMoney), hackData.cpuCores);
}

const getWeakenNeededThreads = (ns: NS, targetHost: string, hackData: HackData) => {
    const currentSecurity = ns.getServerSecurityLevel(targetHost);
    let weakenThreadNeeded = 0
    while (currentSecurity - ns.weakenAnalyze(weakenThreadNeeded, hackData.cpuCores) > (hackData.minDifficulty as number)) {
        weakenThreadNeeded++;
    }
    return weakenThreadNeeded;
}
