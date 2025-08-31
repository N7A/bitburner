import {ProcessRequest} from 'workspace/load-balancer/domain/model/ProcessRequest'
import { ProcessRequestType } from "workspace/load-balancer/domain/model/ProcessRequestType";
import { ServersService } from 'workspace/servers/servers.service';
import * as Referentiel from 'workspace/referentiel'
import {ExecutionOrder} from 'workspace/load-balancer/model/ExecutionServer'
import * as Log from 'workspace/socle/utils/logging';
import { ShareRamExecution } from 'workspace/resource-generator/faction/model/ShareRamExecution'
import { PayloadExecution } from 'workspace/resource-generator/hacking/model/PayloadExecution'
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import { SetupExecution } from 'workspace/resource-generator/hacking/model/SetupExecution';
import { TerminalLogger } from 'workspace/socle/TerminalLogger';
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'
import { waitEndExecution } from 'workspace/socle/utils/execution';
import { getRepartitions } from 'workspace/load-balancer/execution-server.selector';

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

        ns.print(Log.action('Define servers repartion'));
        // define servers repartion
        const executions: Map<RamResourceExecution, ExecutionOrder[]> = await getRepartitions(ns, orders);

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
    const serversService = new ServersService(ns);

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
    
    const ramDisponible = serversService.getAllExecutable()
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
        
        newRamDisponible = serversService.getAllExecutable()
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
