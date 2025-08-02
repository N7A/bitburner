import {Order, OrderType} from 'workspace/domain/executions/model/Order'
import * as ExecutionsRepository from 'workspace/domain/executions/executions.repository'
import * as ServersRepository from 'workspace/domain/servers/servers.repository'
import * as Referentiel from 'workspace/referentiel'
import {ExecutionParameters, ScriptParameters} from 'workspace/load-balancer/model/ExecutionServer'
import * as Log from 'workspace/frameworks/logging';
import { Ram, getCurrentRam } from 'workspace/piggy-bank/application-properties'
import { weights } from 'workspace/load-balancer/application-properties'

//#region Constantes
const SHARE_RAM_SCRIPT_FILENAME: string = Referentiel.FACTION_DIRECTORY + '/' + 'share-ram.looper.ts'
//#endregion Constantes

export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);

    do {
        const orders: Order[] = ExecutionsRepository.getAll(ns);

        // TODO : if orders change
        // TODO : or if execution link with order not running ?
        // TODO : then kill all; recalcul repartition; execution

        const availableServers: string[] = ServersRepository.getAll(ns)
            .map(x => ServersRepository.get(ns, x))
            .filter(x => x.state.unlocked)
            .map(x => x.name);

        let executions: ExecutionParameters[] = [];
        // recherche du nombre de thread possible sur le serveur
        for(const order of orders) {

            // TODO : only worker (run loop)
            let scriptsFilepath: ScriptParameters[] = [];
            let specifiqueAvailableServers: string[] = availableServers
            if (order.type === OrderType.SHARE_RAM) {
                scriptsFilepath.push({scriptsFilepath: SHARE_RAM_SCRIPT_FILENAME} as ScriptParameters);
                specifiqueAvailableServers = ['home']
            }
            const weight = weights.get(order.type) / orders.filter(x => x.type === order.type).length;

            for(const server of specifiqueAvailableServers) {
                let execution: ExecutionParameters = {
                    hostname: server, 
                    nbThread: await getExecutionPossible(ns, server, scriptsFilepath), 
                    scripts: scriptsFilepath
                };
                executions.push(execution)
            }
        }

        // TODO : reppartition with weight

        // lancement des scripts
        for(const execution of executions) {
            await execute(ns, execution);
        }

        if (input.runHasLoop) {
            await ns.sleep(500);
        }
    } while (input.runHasLoop)
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
        runHasLoop: ns.args[0] ? (ns.args[0] as boolean) : true
    };
}
//#endregion Input arguments

//#region Répartition
async function getExecutionPossible(ns: NS, hostname: string, scripts: ScriptParameters[]): Promise<number> {
    const ramNeededByThread = await getRamNeeded(ns, hostname, scripts);
    if (ramNeededByThread === undefined) {
        return 0;
    }

    const currentAvailableRam: number = availableRam(ns, hostname);
    ns.tprint(`[${hostname}]`, ' ', Log.INFO('Available RAM', ns.formatRam(currentAvailableRam)));

    // find possible thread number
    return getNbPossibleThreads(currentAvailableRam, ramNeededByThread);
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
