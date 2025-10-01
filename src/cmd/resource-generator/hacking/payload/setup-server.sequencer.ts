import * as Referentiel from 'workspace/common/referentiel'
import { ServerData } from 'workspace/servers/domain/model/ServerData'
import { HackData } from 'workspace/servers/domain/model/HackData'
import { ServersRepository } from 'workspace/servers/domain/servers.repository';
import * as Log from 'workspace/socle/utils/logging';
import { ProcessRequestType } from 'workspace/load-balancer/domain/model/ProcessRequestType';
import { ExecutionOrdersService } from 'workspace/load-balancer/execution-orders.service';
import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest'
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository';
import { getScriptName } from 'workspace/socle/utils/file';
import { DaemonFlags } from 'workspace/common/model/DaemonFlags';

//#region Constants
const ENABLE_PAYLOAD_SCRIPT = "cmd/load-balancer/domain/payload.enable.ts";
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

    // load host data
    const data: ServerData|null = serversRepository.get(targetHost);
    const hackData: HackData = data!.hackData

    //#region Setup
    ns.print(`${Log.date(ns, new Date())} - ${Log.color('Starting Weaken', Log.Color.CYAN)}`);
    await runScriptUntilEnoughThread(ns, targetHost, hackData, weakenToMax, getWeakenNeededThreads)

    ns.print(`${Log.date(ns, new Date())} - `, 'SUCCESS', ' ', 'Weaken done');

    const moneyThresh = hackData.moneyMax as number;
    if (moneyThresh > 0) {
        ns.print(`${Log.date(ns, new Date())} - ${Log.color('Starting Grow', Log.Color.CYAN)}`);
        await runScriptUntilEnoughThread(ns, targetHost, hackData, growToMax, getGrowthNeededThreads)
        ns.print(`${Log.date(ns, new Date())} - `, 'SUCCESS', ' ', 'Grow done');
    }
    //#endregion Setup

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

async function runScriptUntilEnoughThread(
    ns: NS, 
    targetHost: string, 
    hackData: HackData, 
    work: (ns: NS, threadToLaunch: number, targetHost: string) => Promise<any>,
    getNeededThreads: (ns: NS, targetHost: string, hackData: HackData) => number
) {
    let neededThread: number;
    
    ns.print(Log.getStartLog());
    do {
        // define needed threads
        neededThread = Math.floor(getNeededThreads(ns, targetHost, hackData));
        
        ns.print(Log.INFO('Needed thread', ns.formatNumber(neededThread, 0)));

        if (neededThread > 0) {
            ns.print('----------')
            // wait execution end
            await work(ns, neededThread, targetHost);
        }
    } while(neededThread > 0)
    ns.print(Log.getEndLog());
}

async function growToMax(ns: NS, threadToLaunch: number, targetHost: string) {
    const executionOrdersService = new ExecutionOrdersService(ns);
    
    const processRequest: ProcessRequest = {
        type: ProcessRequestType.ONESHOT, 
        id: targetHost, 
        weight: 1, 
        label: 'growToMax',
        request: {
            wantedThreadNumber: threadToLaunch,
            scripts: [{scriptsFilepath: GROW_SCRIPT, args: [targetHost, `--${DaemonFlags.oneshot}`]}]
        }
    };
    executionOrdersService.add(processRequest);

    const repository = new ServersRepository(ns);
    // load host data
    const data: ServerData|null = repository.get(targetHost);
    const hackData: HackData = data!.hackData

    // on attend la fin du grow
    ns.print(`${Log.date(ns, new Date())} - `, 'INFO', ' ', `Waiting ${getScriptName(GROW_SCRIPT)}...`);
    
    let orders: ProcessRequest[] = await executionOrdersService.getAll();
    while (
        orders.some(x => ExecutionsRepository.getHash(processRequest) === ExecutionsRepository.getHash(x))
    ) {
            await ns.asleep(500);
        orders = await executionOrdersService.getAll();
    }

    // TODO : run weaken in same time
    await runScriptUntilEnoughThread(ns, targetHost, hackData, weakenToMax, getWeakenNeededThreads);
}

async function weakenToMax(ns: NS, threadToLaunch: number, targetHost: string): Promise<void> {
    const executionOrdersService = new ExecutionOrdersService(ns);

    const processRequest: ProcessRequest = {
        type: ProcessRequestType.ONESHOT, 
        id: targetHost, 
        weight: 1, 
        label: 'weakenToMax',
        request: {
            wantedThreadNumber: threadToLaunch,
            scripts: [{scriptsFilepath: WEAKEN_SCRIPT, args: [targetHost, `--${DaemonFlags.oneshot}`]}]
        }
    };
    executionOrdersService.add(processRequest);
    
    // wait execution end
    ns.print(`${Log.date(ns, new Date())} - `, 'INFO', ' ', 
        `Waiting ${getScriptName(WEAKEN_SCRIPT)}...`);

    let orders: ProcessRequest[] = await executionOrdersService.getAll();
    while (
        orders.some(x => ExecutionsRepository.getHash(processRequest) === ExecutionsRepository.getHash(x))
    ) {
            await ns.asleep(500);
            orders = await executionOrdersService.getAll();
    }
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
