import {Order, OrderType} from 'workspace/domain/executions/model/Order'
import * as ExecutionsRepository from 'workspace/domain/executions/executions.repository'
import * as ServersRepository from 'workspace/domain/servers/servers.repository'
import * as Referentiel from 'workspace/referentiel'
import {ExecutionParameters, ScriptParameters} from 'workspace/load-balancer/model/ExecutionServer'
import * as Log from 'workspace/frameworks/logging';
import { Ram, getCurrentRam } from 'workspace/piggy-bank/application-properties'
import { weights } from 'workspace/load-balancer/application-properties'
import * as OwnedServers from 'workspace/domain/owned-servers.repository'
import { ShareRamExecution } from 'workspace/faction/model/ShareRamExecution'
import { PayloadExecution } from 'workspace/hacking/model/PayloadExecution'

export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);

    setupDashboard(ns);

    let orders: Order[] = [];

    ns.atExit(() => {
        orders.flatMap(x => x.pid).forEach(x => {
            if (x) {
                ns.kill(x)
            }
        })
        orders.forEach(x => {
            x.pid = []
        })
        ExecutionsRepository.resetWith(ns, orders)
    });
    
    do {
        //ns.clearLog();
        ns.print(Log.getStartLog());

        ns.print('Waiting order modification...');
        // TODO : wait orders change or ram disponible
        // wait until orders change
        const currentOrders = await waitOrderChange(ns);

        // kill all for recalcul repartition
        orders.flatMap(x => x.pid)
            .forEach(x => {
                if (x !== undefined) {
                    ns.kill(x)
                }
            });
        // maj orders
        orders = Array.from(currentOrders);

        // get target servers
        const targetServers: string[] = getTargetServers(ns);

        ns.print(Log.action('Define servers repartion'));
        // define servers repartion
        const executions: Map<Order, ExecutionParameters[]> = await getRepartitions(ns, orders, targetServers);

        ns.print(Log.action('Executions'));
        let ordersToSave: Order[] = [];
        // lancement des scripts
        for (const order of executions.keys()) {
            let orderToSave = order;
            let currentExecutions = executions.get(order)
            if (!currentExecutions) {
                ordersToSave.push(order)
                continue;
            }
            for(const execution of currentExecutions) {
                let action: string = '';
                if (order.type === OrderType.SHARE_RAM) {
                    action = Log.action('Sharing');
                } else if (order.type === OrderType.HACK) {
                    action = `${Log.action('Hacking')} ${order.target ? Log.target(order.target) + ' ': ''}`;
                }
                // TODO : setup dashboard, pour reduire au minimum la ram
                const pids = await execute(ns, execution);
                ns.print(`${action} ${ns.formatNumber(execution.nbThread, 0)} threads on ${Log.source(execution.hostname)}`);
                orderToSave.pid = [...(orderToSave.pid ?? []), ...pids];
            }
            ordersToSave.push(order)
        }
        ExecutionsRepository.resetWith(ns, ordersToSave)

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
        runHasLoop: ns.args !== undefined ? (ns.args[0] as boolean) : true
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

async function waitOrderChange(ns: NS): Promise<Order[]> {
    let currentOrders: Order[] = ExecutionsRepository.getAll(ns)
        .filter((order: Order) => {
            if (order.type === OrderType.SHARE_RAM) {
                return !new ShareRamExecution().isExecutionUsless(ns);
            }

            return true;
        });
    
    const ramDisponible = getTargetServers(ns)
            .map(x => availableRam(ns, x))
            .reduce((a,b) => a+b);
    let newRamDisponible = ramDisponible

    while (
        currentOrders.every(x => x.pid && x.pid.length > 0)
        && newRamDisponible === ramDisponible
    ) {
        await ns.sleep(500);
        
        newRamDisponible = getTargetServers(ns)
            .map(x => availableRam(ns, x))
            .reduce((a,b) => a+b);

        // remove from orders manual killed or script KO 
        // TODO : alert ?
        const killedOrders: Order[] = ExecutionsRepository.getAll(ns)
            .filter(x => x.pid?.some(y => !ns.isRunning(y)));
        if (killedOrders.length > 0) {
            killedOrders.forEach(x => ExecutionsRepository.remove(ns, x));
            ns.print('Execution order killed : ', killedOrders.map(x => x.type + ' ' + x.target));
            currentOrders = ExecutionsRepository.getAll(ns)
                .filter(order => {
                    if (order.type === OrderType.SHARE_RAM) {
                        return !new ShareRamExecution().isExecutionUsless(ns);
                    }

                    return true;
                });
            break;
        }
        
        currentOrders = ExecutionsRepository.getAll(ns)
            .filter(order => {
                if (order.type === OrderType.SHARE_RAM) {
                    return !new ShareRamExecution().isExecutionUsless(ns);
                }

                return true;
            });
        
    }

    return currentOrders;
}

//#region Répartition
function getTargetServers(ns: NS) {
    return Array.from(new Set([
            ...OwnedServers.getAll(ns).map(x => x.hostname),
            ...ServersRepository.getAll(ns)
                .map(x => ServersRepository.get(ns, x))
                .filter(x => x.state.unlocked)
                .map(x => x.name)
        ]));
}

async function getRepartitions(ns: NS, orders: Order[], targetServers: string[]): Promise<Map<Order, ExecutionParameters[]>> {
    let executions: Map<Order, ExecutionParameters[]> = new Map();
    
    // init ram disponible by server
    let ramByServer: Map<string, number> = new Map(targetServers.map(x => [x, availableRam(ns, x)]));

    const ramDisponible = targetServers.map(x => availableRam(ns, x)).reduce((a,b) => a+b);

    for(const order of orders) {
        let weightType = (weights.get(order.type) ?? 1) / Array.from(new Set(orders.map(x => x.type))).length;
        let weightPerso = (order.weight ?? 1) / Math.max(orders.filter(x => x.type === order.type)
            .map(x => x.weight ?? 1)
            .reduce((a,b) => a+b), 1);
            
        // TODO : only worker (run loop)
        let scriptsFilepath: ScriptParameters[] = [];
        if (order.type === OrderType.SHARE_RAM) {
            scriptsFilepath.push(...new ShareRamExecution().getScript().map(x => {return {scriptsFilepath: x} as ScriptParameters}));
        } else if (order.type === OrderType.HACK && order.target) {
            scriptsFilepath.push(...new PayloadExecution(ns, order.target).getScript().map(x => {return {scriptsFilepath: x, args: [order.target]} as ScriptParameters}));
        }
        ns.print(Log.INFO('Order', scriptsFilepath.map(x => x.scriptsFilepath)));

        const ramAuthorized = weightPerso * weightType * ramDisponible;
        ns.print(Log.INFO('Weight perso', weightPerso));
        ns.print(Log.INFO('Weight type', weightType));
        ns.print(Log.INFO('Ram authorisée', ns.formatRam(ramAuthorized) + '/' + ns.formatRam(ramDisponible)));

        order.pid = []
        // recherche de la répartition possible sur les serveurs
        executions.set(order, await getExecutionRepartition(ns, ramByServer, scriptsFilepath, ramAuthorized));
    }

    return executions;
}

async function getExecutionRepartition(ns: NS, ramByServer: Map<string, number>, scripts: ScriptParameters[], ramAuthorized: number): Promise<ExecutionParameters[]> {
    let executions: ExecutionParameters[] = [];

    let ramNeeded = ramAuthorized;
    const entries = Array.from(ramByServer.entries())
        .sort((a,b) => a[1] - b[1]);
    
    for(const entry of entries) {
        const ramNeededByThread = await getRamNeeded(ns, entry[0], scripts);
        if (ramNeededByThread === undefined || ramAuthorized < ramNeededByThread) {
            continue;
        }
        const currentAvailableRam: number = entry[1] ?? 0;

        // find possible thread number
        const nbThreadPossible = getNbPossibleThreads(Math.min(currentAvailableRam, ramNeeded), ramNeededByThread);

        if (nbThreadPossible > 0) {
                let execution: ExecutionParameters = {
                    hostname: entry[0], 
                    nbThread: nbThreadPossible, 
                    scripts: scripts
                };
                executions.push(execution);

                ramByServer.set(entry[0], currentAvailableRam-nbThreadPossible * ramNeededByThread);
                ramNeeded -= nbThreadPossible * ramNeededByThread;
                if (ramNeeded <= 0) {
                    break;
                }
        }
    }

    return executions;
}

async function getRamNeeded(ns: NS, hostname: string, scripts: ScriptParameters[]): Promise<number|undefined> {
    let result: number = 0;
    for (const script of scripts) {
        if (!ns.fileExists(script.scriptsFilepath, hostname)) {
            ns.tprint('WARN', ' ', `Script ${script.scriptsFilepath} inexistant sur ${hostname}`);
            const copyPid = ns.run(Referentiel.HACKING_DIRECTORY + '/spreading/copy-toolkit.worker.ts', 1, hostname);
            while(copyPid != 0 && ns.isRunning(copyPid)) {
                await ns.asleep(500);
            }
        }

        let ramNeededByThread = ns.getScriptRam(script.scriptsFilepath, hostname);
        if (ramNeededByThread <= 0) {
            ns.tprint('ERROR', ' ', `Script ${script.scriptsFilepath} inexistant sur ${hostname}`);
            return undefined
        }
        result += ramNeededByThread;
    }
    return result;
}

function availableRam(ns: NS, targetHost: string) {
    return Ram.getDisponibleRam(getCurrentRam(ns, targetHost), targetHost);
}

function getNbPossibleThreads(availiableRam: number, ramNeededByThread: number) {
    return Math.floor(availiableRam / ramNeededByThread);
}
//#endregion Répartition

//#region Execution
async function execute(ns: NS, execution: ExecutionParameters): Promise<number[]> {
    let pids: number[] = []
    if (execution.nbThread === 0) {
        return pids;
    }

    for (const script of execution.scripts) {
        // setup
        if (!ns.fileExists(script.scriptsFilepath, execution.hostname)) {
            ns.tprint('WARN', ' ', `Script ${script.scriptsFilepath} inexistant sur ${execution.hostname}`);
            const copyPid = ns.run(Referentiel.HACKING_DIRECTORY + '/spreading/copy-toolkit.worker.ts', 1, execution.hostname);
            while(copyPid != 0 && ns.isRunning(copyPid)) {
                await ns.asleep(500);
            }
        }

        const executionPid: number = ns.exec(script.scriptsFilepath, execution.hostname, execution.nbThread, ...script.args ?? []);
        if (executionPid !==0 && new ShareRamExecution().getScript().includes(script.scriptsFilepath)) {
            new ShareRamExecution().setupDashboard(ns, execution.hostname);
        }
        pids.push(executionPid);

        if (executionPid === 0) {
            return pids;
        }
    }

    return pids;
}
//#endregion Execution
