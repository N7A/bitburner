import {ExecutionParameters, ExecutionType} from 'workspace/load-balancer/model/ExecutionServer'
import * as Properties from 'workspace/load-balancer/application-properties'
import * as OwnedServersRepository from 'workspace/domain/owned-servers.repository'

/**
 * Check RAM availability to priorize
 */
// TODO : ajout possibilité de split entre plusieurs serveurs
export function getAvailableServer(ns: NS, ramNeededByThread: number, nbThread: number = 1, priorityTarget?: string): ExecutionParameters {
    //#region input parameters
    var executionType: ExecutionType = ns.args.length >= 2 ? ns.args[1] as ExecutionType : ExecutionType.ONESHOT
    //#endregion input parameters

    let result: ExecutionParameters = {
        hostname: '',
        nbThread: 0
    }

    if (ramNeededByThread === undefined) {
        ns.print('ERROR', ' ', 'ramNeededByThread non renseigné');
        return result;
    }

    const availableServers = getAvailableServers(ns, priorityTarget, ramNeededByThread*nbThread);
    if (availableServers.length > 0) {
        result = {
            hostname: availableServers[0],
            nbThread: nbThread
        }
    }

    if (result.nbThread === 0) {
        if (executionType === ExecutionType.ONESHOT) {
        }
        if (executionType === ExecutionType.RUNNER) {
            ns.print('WARN', ' ', 'Not enough RAM for the runner');
        }
        // TODO : respect max time
        // reduce nb threads to push un host ok
        const maxRamServer = getOwnedServers(ns, priorityTarget)
            .sort((a, b) =>  availableRam(ns, a) - availableRam(ns, b))
            .pop();


        if (maxRamServer) {
            result.hostname = maxRamServer;
            result.nbThread = getNbPossibleThreads(availableRam(ns, maxRamServer), 1, ramNeededByThread);
        }
    }

    return result;
}

function getNbPossibleThreads(availiableRam: number, nbScript: number, ramNeededByThread: number) {
    return Math.floor(Math.floor(availiableRam / nbScript) / ramNeededByThread);
}

function getAvailableServers(ns: NS, priorityTarget: string|undefined, ramNeeded: number) {
    return getOwnedServers(ns, priorityTarget)
        .filter(host => hasEnoughRam(ns, host, ramNeeded));
}

function getOwnedServers(ns: NS, priorityTarget?: string) {
    let ownedHosts: string[] = []
    if (priorityTarget) {
        ownedHosts.push(priorityTarget);
    }
    ownedHosts.push(
        ...OwnedServersRepository.getAll(ns)
        .map(x => x.hostname)
        .sort((a, b) =>  availableRam(ns, a) - availableRam(ns, b))
        .reverse()
    );

    return ownedHosts;
}

function hasEnoughRam(ns: NS, targetHost: string, ramNeeded: number) {
    if (availableRam(ns, targetHost) < ramNeeded) {
        ns.print('WARN', ' ', `[${targetHost}] RAM insuffisante `, ns.formatRam(availableRam(ns, targetHost)), ' >>> ', ns.formatRam(ramNeeded));
        return false;
    }

    return true;
}

function availableRam(ns: NS, targetHost: string) {
    return Math.max(ns.getServerMaxRam(targetHost) - ns.getServerUsedRam(targetHost) - (Properties.ramReserve.get(targetHost) ?? 0), 0);
}