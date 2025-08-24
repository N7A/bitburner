import * as Referentiel from 'workspace/referentiel'
import { ServerData } from 'workspace/servers/domain/model/ServerData'
import { HackData } from 'workspace/servers/domain/model/HackData'
import{getAvailableServer} from 'workspace/load-balancer/main'
import {ExecutionOrder} from 'workspace/load-balancer/model/ExecutionServer'
import { ServersRepository } from 'workspace/servers/domain/servers.repository';
import * as Log from 'workspace/frameworks/logging';
import { ProcessRequestType } from 'workspace/load-balancer/domain/model/ProcessRequestType';
import { waitEndExecution } from 'workspace/frameworks/execution';
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'

//#region Constants
const ENABLE_PAYLOAD_SCRIPT = "workspace/load-balancer/domain/payload.enable.ts";
const WEAKEN_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/weaken.daemon.ts';
const GROW_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/grow.daemon.ts';
//#endregion Constants

/**
 * Augmente au maximum l'argent disponible sur un serveur,
 * puis réduit au minimum la sécurité,
 * puis lance les runners de grow, weaken et hack.
 */
export async function main(ns: NS) {
    const serversRepository = new ServersRepository(ns);

    //#region input parameters
    var targetHost: string = ns.args.length >= 1 ? ns.args[0] as string : ns.getHostname()
    //#endregion input parameters

    setupDashboard(ns, targetHost);

    const executionsRepository = new ExecutionsRepository(ns);

    // load host data
    const data: ServerData|null = serversRepository.get(targetHost);
    const hackData: HackData = data!.hackData

    //#region Setup
    ns.print(`${Log.date(ns, new Date())} - ${Log.color('Starting Weaken', Log.Color.CYAN)}`);
    await runScriptUntilEnoughThread(ns, targetHost, hackData, ns.getScriptRam(WEAKEN_SCRIPT), weakenToMax, getWeakenNeededThreads)
    
    ns.print(`${Log.date(ns, new Date())} - `, 'SUCCESS', ' ', 'Weaken done');

    const moneyThresh = hackData.moneyMax as number;
    if (moneyThresh > 0) {
        ns.print(`${Log.date(ns, new Date())} - ${Log.color('Starting Grow', Log.Color.CYAN)}`);
        await runScriptUntilEnoughThread(ns, targetHost, hackData, ns.getScriptRam(GROW_SCRIPT), growToMax, getGrowthNeededThreads)
        ns.print(`${Log.date(ns, new Date())} - `, 'SUCCESS', ' ', 'Grow done');
    }
    //#endregion Setup

    executionsRepository.remove({type: ProcessRequestType.SETUP_HACK, target: targetHost});

    ns.run(ENABLE_PAYLOAD_SCRIPT, 1, targetHost);

    ns.print(`${Log.date(ns, new Date())} - ${Log.color('Payload launched', Log.Color.CYAN)}`);
}

function setupDashboard(ns: NS, targetHost: string) {
	ns.disableLog("ALL");
    ns.clearLog();
	
	//ns.ui.openTail();
	ns.ui.setTailTitle(`Setup payload > ${targetHost} <`);
	ns.ui.moveTail(1200, 50);
	ns.print(Log.INFO('Start time', Log.date(ns, new Date())));
	ns.print(`${Log.date(ns, new Date())} - `, 'INFO', ' ', 'Waiting to setup...');
}

function refreshDashBoard(ns: NS, neededGrowThread: number, possibleGrowThread: number) {
    ns.print(Log.INFO('Needed thread', ns.formatNumber(neededGrowThread, 0)));
    ns.print(Log.INFO('Available thread', ns.formatNumber(possibleGrowThread, 0)));
}

async function runScriptUntilEnoughThread(
    ns: NS, 
    targetHost: string, 
    hackData: HackData, 
    ramCost: number, 
    work: (ns: NS, threadToLaunch: number, sourceHostname: string, targetHost: string) => Promise<any>,
    getNeededThreads: (ns: NS, targetHost: string, hackData: HackData) => number
) {
    let neededThread: number;
    
    ns.print(Log.getStartLog());
    do {
        // define needed threads
        neededThread = Math.floor(getNeededThreads(ns, targetHost, hackData));
        
        // define server from where to execute
        const availableServer: ExecutionOrder = getAvailableServer(ns, ramCost, neededThread);
        refreshDashBoard(ns, neededThread, availableServer.nbThread);

        // define thread to launch
        const threadToLaunch = Math.min(neededThread, availableServer.nbThread);
        if (threadToLaunch > 0) {
            ns.print('----------')
            // wait execution end
            await work(ns, threadToLaunch, availableServer.sourceHostname, targetHost);
        } else {
            await ns.asleep(500)
        }
    } while(neededThread > 0)
    ns.print(Log.getEndLog());
}

async function growToMax(ns: NS, threadToLaunch: number, sourceHostname: string, targetHost: string) {
    const repository = new ServersRepository(ns);
    // load host data
    const data: ServerData|null = repository.get(targetHost);
    const hackData: HackData = data!.hackData

    // execute grow with max threads possible
    let pidExecution = ns.exec(GROW_SCRIPT, sourceHostname, threadToLaunch, targetHost, false);
    // on attend la fin du grow
    ns.print(`${Log.date(ns, new Date())} - `, 'INFO', ' ', `Waiting ${GROW_SCRIPT.substring(GROW_SCRIPT.lastIndexOf('/'), GROW_SCRIPT.lastIndexOf('.ts'))} on {${sourceHostname}}...`);
    await waitEndExecution(ns, pidExecution);

    // TODO : run weaken in same time
    await runScriptUntilEnoughThread(ns, targetHost, hackData, ns.getScriptRam(WEAKEN_SCRIPT), weakenToMax, getWeakenNeededThreads);
}

async function weakenToMax(ns: NS, threadToLaunch: number, sourceHostname: string, targetHost: string): Promise<void> {
    let pidExecution = ns.exec(WEAKEN_SCRIPT, sourceHostname, threadToLaunch, targetHost, false);
    // wait execution end
    ns.print(`${Log.date(ns, new Date())} - `, 'INFO', ' ', 
        `Waiting ${WEAKEN_SCRIPT.substring(WEAKEN_SCRIPT.lastIndexOf('/'), WEAKEN_SCRIPT.lastIndexOf('.ts'))} on {${sourceHostname}}...`);
    await waitEndExecution(ns, pidExecution);
}

const getGrowthNeededThreads = (ns: NS, targetHost: string, hackData: HackData) => {
    const currentMoney = Math.max(ns.getServerMoneyAvailable(targetHost), 1);
    return Math.floor(ns.growthAnalyze(targetHost, Math.ceil(hackData.moneyMax as number / currentMoney), hackData.cpuCores));
}

const getWeakenNeededThreads = (ns: NS, targetHost: string, hackData: HackData) => {
    const currentSecurity = ns.getServerSecurityLevel(targetHost);
    let weakenThreadNeeded = 0
    while (currentSecurity - ns.weakenAnalyze(weakenThreadNeeded, hackData.cpuCores) > (hackData.minDifficulty as number)) {
        weakenThreadNeeded++;
    }
    return weakenThreadNeeded;
}
