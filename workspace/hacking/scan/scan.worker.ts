import {Targets} from 'workspace/hacking/model/Targets'
import {TargetHost} from 'workspace/hacking/model/TargetHost'
import * as TargetsRepository from 'workspace/domain/targets/targets.repository'
import * as ServersRepository from 'workspace/domain/servers/servers.repository'
import * as OwnedServersRepository from 'workspace/domain/owned-servers.repository'
import {OwnedServer} from 'workspace/load-balancer/model/OwnedServer'
import * as Log from 'workspace/logging-framework/main'

/**
 * Scan les cibles données par le unlock.
 */
export async function main(ns: NS, scanTargets: string[]) {
    // load input arguments
    const input: InputArg = getInput(ns, scanTargets);

    setupDashboard(ns);
    
    for (const target of input.hostnamesTarget) {
        ns.print(Log.getStartLog());
        ns.print(Log.action('Scan'), ' ', Log.target(target));

        // update targets repository
        TargetsRepository.removeScan(ns, target);

        // listing des voisins
        const neighbors = getNeighbors(ns, target);

        ns.tprint('SUCCESS', ' ', `${target} [scanned]`);

        // load targets
        const targets: Targets = TargetsRepository.get(ns);
        const newTargets = neighbors
            .filter(x => !targets.unlockTargets.includes(x))
            .filter(x => !targets.hackableTargets.includes(x))
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
    let result: InputArg = {
        hostnamesTarget: (ns.args[0] ?? hostnamesTarget ?? [ns.getHostname()]) as string[]
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
function handleNewTargets(ns: NS, newTargets: string[], parent: string) {
    // aucune nouvelle cible à traiter
    if (newTargets.length <= 0) {
        return false;
    }

    // add to scan targets
    TargetsRepository.addScan(ns, newTargets);
    // add to unlock targets
    TargetsRepository.addUnlock(ns, newTargets);
    
    ns.tprint('INFO', ' ', `New targets (${newTargets.length}) to unlock from ${parent} : `, newTargets);

    let depth: number|null;
    if (parent === 'home') {
        depth = 1;
    } else {
        // get parent data
        let data: TargetHost|null = ServersRepository.get(ns, parent);
        depth = data?.depth ? data.depth + 1 : null;
    }
    
    // enregistrement des données des serveurs voisins
    for (const newTarget of newTargets) {
        if (depth) {
            ns.run('workspace/domain/servers/save-server.worker.ts', undefined, newTarget, parent, depth)
        } else {
            ns.run('workspace/domain/servers/save-server.worker.ts', undefined, newTarget, parent)
        }
    }

    return true;
}

