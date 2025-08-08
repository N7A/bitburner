import {ServerData, ServerType} from 'workspace/domain/servers/model/ServerData'
import { ServersRepository } from 'workspace/domain/servers/servers.repository'
import * as OwnedServersRepository from 'workspace/domain/owned-servers.repository'
import {OwnedServer} from 'workspace/load-balancer/model/OwnedServer'
import * as Log from 'workspace/frameworks/logging';

/**
 * Scan les cibles données par le unlock.
 */
export async function main(ns: NS, scanTargets: string[]) {
    // load input arguments
    const input: InputArg = getInput(ns, scanTargets);

    //setupDashboard(ns);
    
    for (const target of input.hostnamesTarget) {
        ns.print(Log.getStartLog());
        ns.print(Log.action('Scan'), ' ', Log.target(target));

        // update targets repository
        ServersRepository.setScanned(ns, target);

        // listing des voisins
        const neighbors = getNeighbors(ns, target);

        ns.tprint('SUCCESS', ' ', `${target} [scanned]`);

        // load targets
        const newTargets = neighbors
            .filter(x => !ServersRepository.getAll(ns).includes(x))
            .filter(x => !(OwnedServersRepository.getAll(ns) as OwnedServer[]).map(x => x.hostname).includes(x));

        handleNewTargets(ns, newTargets, target);
        
        ns.print(Log.getEndLog());
    }

}

function setupDashboard(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();
    
    ns.ui.setTailTitle('Scan #Worker');
}

//#region Input arguments
type InputArg = {
    /** Serveur cible */
    hostnamesTarget: string[];
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS, hostnamesTarget: string[]): InputArg {
    if (!hostnamesTarget && ns.args[0]) {
        hostnamesTarget = [ns.args[0] as string]
    }
    let result: InputArg = {
        hostnamesTarget: (hostnamesTarget ?? [ns.getHostname()]) as string[]
    };

    return result;
}
//#endregion Input arguments

/**
 * Récupération des serveurs connecté à la cible hormis la cible (le parent).
 */
function getNeighbors(ns: NS, target: string): string[] {
    // listing des voisins
    let neighbors = ns.scan(target);
    if (target !== 'home') {
        // remove parent
        neighbors.shift();
    }
    return neighbors
}

/**
 * Enregistre en base les nouvelles cibles découvertes.
 * 
 * @returns true si de nouvelles cibles on été traité; false sinon
 */
function handleNewTargets(ns: NS, newTargets: string[], parent: string): boolean {
    // aucune nouvelle cible à traiter
    if (newTargets.length <= 0) {
        return false;
    }
    
    ns.tprint('INFO', ' ', `New targets (${newTargets.length}) to unlock from ${parent} : `, newTargets);

    let depth: number|null;
    if (parent === 'home') {
        depth = 1;
    } else {
        // get parent data
        let data: ServerData|null = ServersRepository.get(ns, parent);
        depth = data?.depth ? data.depth + 1 : null;
    }
    
    // enregistrement des données des serveurs voisins
    for (const newTarget of newTargets) {
        // add to scan targets
        // add to unlock targets
        ServersRepository.add(ns, newTarget, ServerType.EXTERNAL, parent, depth ?? undefined, false);
    }

    return true;
}

