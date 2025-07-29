import {Targets} from 'workspace/hacking/model/Targets'
import {TargetHost} from 'workspace/hacking/model/TargetHost'
import * as TargetsRepository from 'workspace/domain/targets/targets.repository'
import * as ServersRepository from 'workspace/domain/servers/servers.repository'
import * as OwnedServersRepository from 'workspace/domain/owned-servers.repository.ts'

/**
 * Scan les cibles données par le unlock.
 */
export async function main(ns: NS) {
    // load targets
    let targets: Targets = TargetsRepository.get(ns);
    for (const target of Array.from(new Set(targets.scanTargets))) {

        //update targets repository
        TargetsRepository.removeScan(ns, target);

        // listing des voisins
        const neighbors = getNeighbors(ns, target);

        ns.tprint('SUCCESS', ' ', `${target} [scanned]`);

        const newTargets = neighbors.filter(x => !targets.unlockTargets.includes(x))
            .filter(x => !OwnedServersRepository.getAll(ns).includes(x));

        if (newTargets.length > 0) {
            await handleNewTargets(ns, newTargets, target)
        }

    }
}

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
 */
async function handleNewTargets(ns: NS, newTargets: string[], parent: string) {
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

    // TODO : si infection not running -> execute infection
}

