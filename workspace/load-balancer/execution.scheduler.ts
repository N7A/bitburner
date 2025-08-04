import {Order, OrderType} from 'workspace/domain/executions/model/Order'
import * as ExecutionsRepository from 'workspace/domain/executions/executions.repository'
import * as ServersRepository from 'workspace/domain/servers/servers.repository'
import * as Referentiel from 'workspace/referentiel'
import {ExecutionParameters, ScriptParameters} from 'workspace/load-balancer/model/ExecutionServer'
import * as Log from 'workspace/frameworks/logging';
import { Ram, getCurrentRam } from 'workspace/piggy-bank/application-properties'
import { weights } from 'workspace/load-balancer/application-properties'
import * as OwnedServers from 'workspace/domain/owned-servers.repository'
import { ShareRamExecution } from '../faction/model/ShareRamExecution'

//#region Constantes
const SHARE_RAM_SCRIPT_FILENAME: string = Referentiel.FACTION_DIRECTORY + '/' + 'share-ram.worker.ts'
//#endregion Constantes

export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);

    setupDashboard(ns);

    do {
        Log.getStartLog();
        const orders: Order[] = ExecutionsRepository.getAll(ns)
            .filter(order => {
                if (order.type === OrderType.SHARE_RAM) {
                    return !new ShareRamExecution().isExecutionUsless(ns);
                }

                return true;
            });

        // TODO : IF execution link with order not running THEN remove from orders (kill manuel ou script KO -> alert);
        // TODO : IF orders change THEN kill all; recalcul repartition; execution

        const availableServers: string[] = Array.from(new Set([
            ...OwnedServers.getAll(ns).map(x => x.hostname),
            ...ServersRepository.getAll(ns)
                .map(x => ServersRepository.get(ns, x))
                .filter(x => x.state.unlocked)
                .map(x => x.name)
        ]));

            

        // init ram disponible by server
        let ramByServer: Map<string, number> = new Map(availableServers.map(x => [x, availableRam(ns, x)]));

        let executions: ExecutionParameters[] = [];
        for(const order of orders) {

            let weightType = weights.get(order.type) ?? 1 / orders.filter(x => x.type === order.type).length;
            let weightPerso = order.weight ?? 1 / Math.max(orders.filter(x => x.type === order.type)
                .map(x => x.weight ?? 1)
                .reduce((a,b) => a+b), 1);
                
            // TODO : only worker (run loop)
            let scriptsFilepath: ScriptParameters[] = [];
            if (order.type === OrderType.SHARE_RAM) {
                scriptsFilepath.push({scriptsFilepath: SHARE_RAM_SCRIPT_FILENAME} as ScriptParameters);
            }
            ns.print(Log.INFO('Order', scriptsFilepath.map(x => x.scriptsFilepath)));

            const ramDisponible = availableServers.map(x => availableRam(ns, x)).reduce((a,b) => a+b);
            ns.print(Log.INFO('Ram disponible', ramDisponible));


            const ramAuthorized = weightPerso * weightType * ramDisponible;
            ns.print(Log.INFO('Weight perso', weightPerso));
            ns.print(Log.INFO('Weight type', weightType));
            ns.print(Log.INFO('Ram authorisée', ramAuthorized));

            // recherche de la répartition possible sur les serveurs
            executions.push(...await getExecutionRepartition(ns, ramByServer, scriptsFilepath, ramAuthorized));
        }

        ns.print('Executions');
        // lancement des scripts
        for(const execution of executions) {
            // TODO : setup dashboard, pour reduire au minimum la ram
            await execute(ns, execution);
        }

        Log.getEndLog();
        if (input.runHasLoop) {
            await ns.sleep(500);
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

//#region Répartition
async function getExecutionRepartition(ns: NS, hostnames: Map<string, number>, scripts: ScriptParameters[], ramAuthorized: number): Promise<ExecutionParameters[]> {
    let executions: ExecutionParameters[] = [];

    let ramNeeded = ramAuthorized;
    const iterator = hostnames.keys();
    let hostname = iterator.next();
    while(ramNeeded > 0 && hostname.value !== undefined) {
        const ramNeededByThread = await getRamNeeded(ns, hostname.value, scripts);
        if (ramNeededByThread === undefined || ramAuthorized < ramNeededByThread) {
            continue;
        }
        const currentAvailableRam: number = hostnames.get(hostname.value) ?? 0;

        // find possible thread number
        const nbThread = getNbPossibleThreads(currentAvailableRam, ramNeededByThread);

        if (nbThread > 0) {
                let execution: ExecutionParameters = {
                    hostname: hostname.value, 
                    nbThread: nbThread, 
                    scripts: scripts
                };
                executions.push(execution);

                hostnames.set(hostname.value, currentAvailableRam-nbThread * ramNeededByThread);
                ramNeeded -= nbThread * ramNeededByThread;
        }
        hostname = iterator.next();
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
async function execute(ns: NS, execution: ExecutionParameters): Promise<boolean> {
    if (execution.nbThread === 0) {
        return true;
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

        ns.tprint("INFO", " ", `${Log.color(ns.formatNumber(execution.nbThread, 0), Log.Color.CYAN)} threads of ${script.scriptsFilepath} can be runned from ${Log.color(execution.hostname, Log.Color.CYAN)}`);

        const executionPid: number = ns.exec(script.scriptsFilepath, execution.hostname, execution.nbThread, ...script.args ?? []);

        if (executionPid === 0) {
            return false;
        }

        ns.tprint("SUCCESS", " ", `Starting ${Log.color(ns.formatNumber(execution.nbThread, 0), Log.Color.CYAN)} threads of ${script.scriptsFilepath} from ${Log.color(execution.hostname, Log.Color.CYAN)}`);
    }

    return true;
}
//#endregion Execution
