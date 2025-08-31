import {ExecutionOrder, ExecutionType} from 'workspace/load-balancer/model/ExecutionServer'
import { RamPiggyBankService } from 'workspace/piggy-bank/ram-piggy-bank.service'
import { ServersService } from 'workspace/servers/servers.service';

/**
 * Check RAM availability to priorize
 */
// TODO : use load-balancer instead
export function getAvailableServer(ns: NS, ramNeededByThread: number, nbThread: number = 1): ExecutionOrder {
    const serversService = new ServersService(ns);

    let result: ExecutionOrder = {
        sourceHostname: '',
        nbThread: 0,
        request: undefined
    }

    if (ramNeededByThread === undefined) {
        ns.print('ERROR', ' ', 'ramNeededByThread non renseigné');
        return result;
    }

    const selectedServer = serversService.getAllExecutable()
        // remove servers that cant have at least one script
        .filter(host => hasEnoughRam(ns, host, ramNeededByThread))
        // get least available ram server
        .sort((a, b) =>  availableRam(ns, a) - availableRam(ns, b))
        .shift();
    if (selectedServer) {
        // TODO : respect max time
        // reduce nb threads to push un host ok
        if (result.nbThread === 0) {
            // autant de thread que possible
            nbThread = getNbPossibleThreads(availableRam(ns, selectedServer), 1, ramNeededByThread);
        }
        result = {
            sourceHostname: selectedServer,
            nbThread: nbThread,
            request: undefined
        }
    }

    return result;
}

function getNbPossibleThreads(availiableRam: number, nbScript: number, ramNeededByThread: number) {
    return Math.floor(Math.floor(availiableRam / nbScript) / ramNeededByThread);
}

function hasEnoughRam(ns: NS, targetHost: string, ramNeeded: number) {
    if (availableRam(ns, targetHost) < ramNeeded) {
        //ns.print('WARN', ' ', `[${targetHost}] RAM insuffisante `, ns.formatRam(availableRam(ns, targetHost)), ' >>> ', ns.formatRam(ramNeeded));
        return false;
    }

    return true;
}

function availableRam(ns: NS, targetHost: string) {
    return new RamPiggyBankService(ns).getDisponibleRam(targetHost);
}