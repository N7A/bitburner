import { ServersService } from 'workspace/servers/servers.service';
import * as Referentiel from 'workspace/referentiel'
import {ExecutionOrder, ExecutionRequest, ScriptRequest} from 'workspace/load-balancer/model/ExecutionServer'
import * as Log from 'workspace/socle/utils/logging';
import { weights } from 'workspace/load-balancer/application-properties'
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import { Logger } from 'workspace/socle/Logger';
import { waitEndExecution } from 'workspace/socle/utils/execution';
import { RamPiggyBankService } from 'workspace/piggy-bank/ram-piggy-bank.service';

export async function getRepartitions(ns: NS, orders: RamResourceExecution[]): Promise<Map<RamResourceExecution, ExecutionOrder[]>> {
    const serversService = new ServersService(ns);
    const targetServers: string[] = serversService.getAllExecutable();

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
        // least available ram server first
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

/**
 * Retourne la quantité de RAM nécessaire pour faire tourner les scripts cibles.
 * 
 * @param ns Bitburner API
 * @param hostname serveur cible
 * @param scripts scripts cibles
 * @returns quantité de RAM nécessaire
 * 
 * @remarks RAM cost: 0.1 GB
 */
async function getRamNeeded(ns: NS, hostname: string, scripts: ScriptRequest[]): Promise<number|undefined> {
    const logger = new Logger(ns);
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

/**
 * Retourne la quantité de RAM autorisé à être dépensé.
 * 
 * @param ns Bitburner API
 * @param targetHost serveur cible
 * @returns quantité de RAM autorisé
 * 
 * @remarks RAM cost: 0.1 GB
 */
function availableRam(ns: NS, targetHost: string) {
    return new RamPiggyBankService(ns).getDisponibleRam(targetHost);
}

/**
 * Détermine le nombre de thread possible, à partir de la RAM / thread et de la RAM disponible.
 * 
 * @param availableRam RAM disponible
 * @param ramNeededByThread RAM nécessaire par thread
 * @returns nombre de thread possible
 * 
 * @remarks RAM cost: 0 GB
 */
function getNbPossibleThreads(availableRam: number, ramNeededByThread: number) {
    return Math.floor(availableRam / ramNeededByThread);
}