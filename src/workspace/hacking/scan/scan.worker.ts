import {ServerData} from 'workspace/domain/servers/model/ServerData'
import { ServersRepository } from 'workspace/domain/servers/servers.repository'
import * as Log from 'workspace/frameworks/logging';

/**
 * Scan les cibles données par le unlock.
 */
export async function main(ns: NS, scanTarget: string) {
    // load input arguments
    const input: InputArg = getInput(ns, scanTarget);

    if (scanTarget === undefined) {
        setupDashboard(ns, input);
    }
    
    ns.print(Log.getStartLog());
    ns.print(Log.action('Scan'), ' ', Log.target(input.targetHost));

    // update targets repository
    ServersRepository.setScanned(ns, input.targetHost);

    // listing des voisins
    const neighbors = getNeighbors(ns, input.targetHost);

    ns.tprint('SUCCESS', ' ', `${input.targetHost} [scanned]`);

    // load targets
    const newTargets = neighbors
        .filter(x => !ServersRepository.getAll(ns).includes(x));

    handleNewTargets(ns, newTargets, input.targetHost);
    
    ns.print(Log.getEndLog());

}

function setupDashboard(ns: NS, input: InputArg) {
    ns.disableLog("ALL");
    ns.enableLog('scan');
    ns.clearLog();
        
    Log.initTailTitle(ns, `Scan ${Log.targetColorLess(input.targetHost)}`, 'Worker');
}

//#region Input arguments
type InputArg = {
    /** Serveur cible */
    targetHost: string;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS, targetHost: string): InputArg {
    if (!targetHost) {
        if (ns.args[0] === undefined) {
            ns.tprint('ERROR', ' ', 'Merci de renseigner un hostname');
            ns.exit();
        }
        targetHost = ns.args[0] as string
    }
    let result: InputArg = {
        targetHost: (targetHost ?? ns.getHostname()) as string
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
        ServersRepository.add(ns, newTarget, parent, depth ?? undefined);
    }

    return true;
}

