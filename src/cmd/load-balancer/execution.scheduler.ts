import {ProcessRequest} from 'workspace/load-balancer/domain/model/ProcessRequest'
import { ProcessRequestType } from "workspace/load-balancer/domain/model/ProcessRequestType";
import { ServersService } from 'workspace/servers/servers.service';
import * as Referentiel from 'workspace/referentiel'
import {ExecutionOrder, ExecutionRequest, ScriptRequest} from 'workspace/load-balancer/model/ExecutionServer'
import * as Log from 'workspace/socle/utils/logging';
import { RamPiggyBankService } from 'workspace/piggy-bank/ram-piggy-bank.service'
import { weights } from 'workspace/load-balancer/application-properties'
import { ShareRamExecution } from 'workspace/resource-generator/faction/model/ShareRamExecution'
import { PayloadExecution } from 'workspace/resource-generator/hacking/model/PayloadExecution'
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import { SetupExecution } from 'workspace/resource-generator/hacking/model/SetupExecution';
import { TerminalLogger } from 'workspace/socle/TerminalLogger';
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'
import { waitEndExecution } from 'workspace/socle/utils/execution';

export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);

    setupDashboard(ns);

    const executionsRepository = new ExecutionsRepository(ns);

    let orders: RamResourceExecution[] = [];

    ns.atExit(() => {
        orders.map(x => x.request).forEach(x => resetRunningProcess(ns, x));
    });
    
    do {
        //ns.clearLog();
        ns.print(Log.getStartLog());

        ns.print('Waiting request modification...');
        // wait until orders change
        const currentOrders = await waitContextChange(ns, orders);

        // TODO : dont kill hack and setup
        // kill all old for recalcul repartition
        orders.map(x => x.request).forEach(x => resetRunningProcess(ns, x));
        // maj orders
        orders = Array.from(currentOrders);

        // get target servers
        const targetServers: string[] = getTargetServers(ns);

        ns.print(Log.action('Define servers repartion'));
        // define servers repartion
        const executions: Map<RamResourceExecution, ExecutionOrder[]> = await getRepartitions(ns, orders, targetServers);

        ns.print(Log.action('Executions'), ` (${executions.size})`);
        // lancement des scripts
        for (const process of executions.keys()) {
            let currentExecutionOrders = executions.get(process)
            if (!currentExecutionOrders) {
                continue;
            }
            for(const executionOrder of currentExecutionOrders) {
                const pids = await execute(ns, executionOrder);
                
                // TODO : setup dashboard, pour reduire au minimum la ram
                pids.filter(x => x !==0)
                    .forEach(x => {
                        process.setupDashboard(ns, x, executionOrder.sourceHostname);
                    })
                ns.print(`${process.getActionLog()} ${ns.formatNumber(executionOrder.nbThread, 0)} threads on ${Log.source(executionOrder.sourceHostname)}`);
                // maj pid processes
                process.request.pid = [...(process.request.pid ?? []), ...pids];
            }
            executionsRepository.save(process.request)
        }

        ns.print(Log.getEndLog());
        if (input.runHasLoop) {
            await ns.asleep(500);
        }
    } while (input.runHasLoop)
    
    ns.ui.closeTail();
}

//#region Input arguments
type InputArg = {
    /** Serveur cible */
    runHasLoop: boolean;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
    return {
        runHasLoop: ns.args[0] !== undefined ? (ns.args[0] as boolean) : true
    };
}
//#endregion Input arguments

//#region Dashboard
function setupDashboard(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();
    
    Log.initTailTitle(ns, 'Executions', 'Scheduler');
    ns.ui.openTail();
}
//#endregion Dashboard

/**
 * Kill all process linked with process request, then clear pid on repository.
 * @param ns 
 * @param request process request to reset
 */
function resetRunningProcess(ns: NS, request: ProcessRequest) {
    const executionsRepository = new ExecutionsRepository(ns);

    // kill all process
    request.pid?.filter(x => x !== undefined).forEach(x => ns.kill(x));
    // reset all repository pid
    request.pid = [];
    executionsRepository.save(request)
}

/**
 * Wait process orders or available ram change.
 * @param ns 
 * @returns new process orders
 */
async function waitContextChange(ns: NS, requests: RamResourceExecution[]): Promise<RamResourceExecution[]> {
    const executionsRepository = new ExecutionsRepository(ns);

    let newRequest: RamResourceExecution[] = executionsRepository.getAll()   
            .map(order => {
                if (order.type === ProcessRequestType.SHARE_RAM) {
                    return new ShareRamExecution(order);
                } else if (order.type === ProcessRequestType.HACK) {
                    return new PayloadExecution(ns, order);
                } else if (order.type === ProcessRequestType.SETUP_HACK) {
                    return new SetupExecution(order);
                }
                return null;
            })
            .filter(x => x !== null)
            .map(x => x as RamResourceExecution)
            .filter((executionOrder: RamResourceExecution) => !executionOrder?.isExecutionUsless(ns));
    
    const ramDisponible = getTargetServers(ns)
            .map(x => ns.getServerMaxRam(x))
            //.map(x => availableRam(ns, x))
            .reduce((a,b) => a+b);
    let newRamDisponible = ramDisponible

    const getId = (request: RamResourceExecution) => request.request.type + (request.request.target ?? '')
    while (
        // requetes inchangées
        Array.from(new Set([...requests.map(x => getId(x)), ...newRequest.map(x => getId(x))]))
            .every(x => newRequest.map(x => getId(x)).includes(x) && requests.map(x => getId(x)).includes(x))
        // RAM inchangée
        && newRamDisponible === ramDisponible
    ) {
        await ns.sleep(500);
        
        newRamDisponible = getTargetServers(ns)
            .map(x => ns.getServerMaxRam(x))
            //.map(x => availableRam(ns, x))
            .reduce((a,b) => a+b);

        // remove from orders manual killed or script KO 
        // TODO : alert ?
        /*const killedOrders: RamResourceExecution[] = requests.filter(x => x.request.pid?.some(y => !ns.isRunning(y)));
        if (killedOrders.length > 0) {
            killedOrders.forEach(x => ExecutionsRepository.remove(ns, x.request));
            ns.print('Execution order killed : ', killedOrders.map(x => x.request.type + ' ' + x.request.target));
            newRequest = ExecutionsRepository.getAll(ns)
                .map(order => {
                    if (order.type === OrderType.SHARE_RAM) {
                        return new ShareRamExecution(order);
                    } else if (order.type === OrderType.HACK) {
                        return new PayloadExecution(ns, order);
                    } else if (order.type === OrderType.SETUP_HACK) {
                        return new SetupExecution(order);
                    }
                })
                .filter((executionOrder: RamResourceExecution) => !executionOrder?.isExecutionUsless(ns));
            break;
        }*/
        
        newRequest = executionsRepository.getAll()   
            .map(order => {
                if (order.type === ProcessRequestType.SHARE_RAM) {
                    return new ShareRamExecution(order);
                } else if (order.type === ProcessRequestType.HACK) {
                    return new PayloadExecution(ns, order);
                } else if (order.type === ProcessRequestType.SETUP_HACK) {
                    return new SetupExecution(order);
                }
                return null;
            })
            .filter(x => x !== null)
            .map(x => x as RamResourceExecution)
            .filter((executionOrder: RamResourceExecution) => !executionOrder?.isExecutionUsless(ns));
    }

    return newRequest;
}

//#region Répartition
function getTargetServers(ns: NS) {
    const serversService = new ServersService(ns);
    return Array.from(new Set(serversService.getAllExecutable()));
}

async function getRepartitions(ns: NS, orders: RamResourceExecution[], targetServers: string[]): Promise<Map<RamResourceExecution, ExecutionOrder[]>> {
    let executions: Map<RamResourceExecution, ExecutionOrder[]> = new Map();
    
    // init ram disponible by server
    let ramByServer: Map<string, number> = new Map(targetServers.map(x => [x, availableRam(ns, x)]));

    const totalRamDisponible = targetServers.map(x => availableRam(ns, x)).reduce((a,b) => a+b);
    
    // define repartition to fix ram executions
    let ramDisponiblePostFix = totalRamDisponible;
    for(const order of orders.filter(x => x.getExecutionRequest().wantedThreadNumber !== undefined)) {
        const weightType = (weights.get(order.request.type) ?? 1) / Math.max(Array.from(new Set(orders.map(x => x.request.type)))
            .map(x => weights.get(x) ?? 1)
            .reduce((a,b) => a+b), 1);
        const weightPerso = (order.request.weight ?? 1) / Math.max(orders.filter(x => x.request.type === order.request.type)
            .map(x => x.request.weight ?? 1)
            .reduce((a,b) => a+b), 1);
            
        ns.print(Log.INFO('Order', `${order.getActionLog()}${order.request.target ? ' ' + order.request.target : ''}`));

        let ramAuthorized = weightPerso * weightType * totalRamDisponible;
        if (order.getExecutionRequest().wantedThreadNumber) {
            ramAuthorized = Math.min(ramAuthorized, order.getExecutionRequest().wantedThreadNumber * (await getRamNeeded(ns, 'home', order.getExecutionRequest().scripts) ?? 0))
        }
        ns.print(Log.INFO('Weight perso', weightPerso));
        ns.print(Log.INFO('Weight type', weightType));
        ns.print(Log.INFO('Ram authorisée', ns.formatRam(ramAuthorized) + '/' + ns.formatRam(totalRamDisponible)));

        ramDisponiblePostFix -= ramAuthorized
        // recherche de la répartition possible sur les serveurs
        executions.set(order, await getExecutionRepartition(ns, ramByServer, order.getExecutionRequest(), ramAuthorized));
    }

    // define repartition to ram resource executions
    for(const order of orders.filter(x => x.getExecutionRequest().wantedThreadNumber === undefined)) {
        const weightType = (weights.get(order.request.type) ?? 1) / Math.max(Array.from(new Set(orders.map(x => x.request.type)))
            .map(x => weights.get(x) ?? 1)
            .reduce((a,b) => a+b), 1);
        const weightPerso = (order.request.weight ?? 1) / Math.max(orders.filter(x => x.request.type === order.request.type)
            .map(x => x.request.weight ?? 1)
            .reduce((a,b) => a+b), 1);
            
        ns.print(Log.INFO('Order', `${order.getActionLog()}${order.request.target ? ' ' + order.request.target : ''}`));

        let ramAuthorized = weightPerso * weightType * ramDisponiblePostFix;
        ns.print(Log.INFO('Weight perso', weightPerso));
        ns.print(Log.INFO('Weight type', weightType));
        ns.print(Log.INFO('Ram authorisée', ns.formatRam(ramAuthorized) + '/' + ns.formatRam(ramDisponiblePostFix)));

        // recherche de la répartition possible sur les serveurs
        executions.set(order, await getExecutionRepartition(ns, ramByServer, order.getExecutionRequest(), ramAuthorized));
    }

    return executions;
}

async function getExecutionRepartition(ns: NS, ramByServer: Map<string, number>, executionRequest: ExecutionRequest, ramAuthorized: number): Promise<ExecutionOrder[]> {
    let orders: ExecutionOrder[] = [];

    let ramToUse = ramAuthorized;
    const entries = Array.from(ramByServer.entries())
        .sort((a,b) => a[1] - b[1]);
    
    for(const entry of entries) {
        const ramNeededByThread = await getRamNeeded(ns, entry[0], executionRequest.scripts);
        if (ramNeededByThread === undefined) {
            continue;
        }
        // TODO : ramNeededByThread too high lock all executions
        const maxThreadWanted = getNbPossibleThreads(ramToUse, ramNeededByThread)
        // plus de thread possible avec la ram restante
        if (maxThreadWanted <= 0) {
            break;
        }

        const currentAvailableRam: number = entry[1] ?? 0;

        // find possible thread number
        const currentThreadPossible = getNbPossibleThreads(currentAvailableRam, ramNeededByThread);

        const nbThreadPossible = Math.min(currentThreadPossible, maxThreadWanted);

        if (nbThreadPossible > 0) {
            orders.push({
                sourceHostname: entry[0], 
                nbThread: nbThreadPossible, 
                request: executionRequest
            } as ExecutionOrder);

            const ramUsed: number = nbThreadPossible * ramNeededByThread
            // maj ram by server
            ramByServer.set(entry[0], currentAvailableRam - ramUsed);
            // maj ram needed
            ramToUse -= ramUsed;
            if (ramToUse <= 0) {
                break;
            }
        } 
    }

    return orders;
}

async function getRamNeeded(ns: NS, hostname: string, scripts: ScriptRequest[]): Promise<number|undefined> {
    const logger = new TerminalLogger(ns);
    let result: number = 0;
    for (const script of scripts) {
        if (!ns.fileExists(script.scriptsFilepath, hostname)) {
            logger.warn(`Script ${script.scriptsFilepath} inexistant sur ${hostname}`);
            const copyPid = ns.run(Referentiel.HACKING_DIRECTORY + '/spreading/copy-toolkit.worker.ts', 1, hostname);

            await waitEndExecution(ns, copyPid);
        }

        let ramNeededByThread = ns.getScriptRam(script.scriptsFilepath, hostname);
        if (ramNeededByThread <= 0) {
            logger.err(`Script ${script.scriptsFilepath} inexistant sur ${hostname}`);
            return undefined
        }
        result += ramNeededByThread;
    }
    return result;
}

function availableRam(ns: NS, targetHost: string) {
    return new RamPiggyBankService(ns).getDisponibleRam(targetHost);
}

function getNbPossibleThreads(availableRam: number, ramNeededByThread: number) {
    return Math.floor(availableRam / ramNeededByThread);
}
//#endregion Répartition

//#region Execution
async function execute(ns: NS, executionOrder: ExecutionOrder): Promise<number[]> {
    const logger = new TerminalLogger(ns);
    let pids: number[] = []
    if (executionOrder.nbThread === 0) {
        return pids;
    }

    for (const script of executionOrder.request.scripts) {
        // setup
        if (!ns.fileExists(script.scriptsFilepath, executionOrder.sourceHostname)) {
            logger.warn(`Script ${script.scriptsFilepath} inexistant sur ${executionOrder.sourceHostname}`);
            const copyPid = ns.run(Referentiel.HACKING_DIRECTORY + '/spreading/copy-toolkit.worker.ts', 1, executionOrder.sourceHostname);
            
            await waitEndExecution(ns, copyPid);
        }

        const executionPid: number = ns.exec(script.scriptsFilepath, executionOrder.sourceHostname, executionOrder.nbThread, ...script.args ?? []);
        pids.push(executionPid);

        // TODO : reflechir à comment traiter le cas
        if (executionPid === 0) {
            return pids;
        }
    }

    return pids;
}
//#endregion Execution
