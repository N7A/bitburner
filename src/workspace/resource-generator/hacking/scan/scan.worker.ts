import {ServerData} from 'workspace/servers/domain/model/ServerData'
import { ServersRepository } from 'workspace/servers/domain/servers.repository'
import * as Log from 'workspace/socle/utils/logging';
import { Logger } from 'workspace/socle/Logger';
import { Dashboard } from 'workspace/socle/interface/dashboard';

/**
 * Scan les cibles données par le unlock.
 */
export async function main(ns: NS, scanTarget: string) {
    const serversRepository = new ServersRepository(ns);

    // load input arguments
    const input: InputArg = getInput(ns, scanTarget);
    const logger = new Logger(ns);

    if (scanTarget === undefined) {
        setupDashboard(ns, input);
    }
    
    ns.print(Log.getStartLog());
    ns.print(Log.action('Scan'), ' ', Log.target(input.targetHost));

    // update targets repository
    serversRepository.setScanned(input.targetHost);

    // listing des voisins
    const neighbors = getNeighbors(ns, input.targetHost);

    logger.success(`${input.targetHost} [scanned]`);

    // load targets
    const newTargets = neighbors
        .filter(x => !serversRepository.getAllIds().includes(x));

    handleNewTargets(ns, newTargets, input.targetHost);
    
    ns.print(Log.getEndLog());

}

function setupDashboard(ns: NS, input: InputArg) {
    ns.disableLog("ALL");
    ns.enableLog('scan');
    ns.clearLog();
    
    const dashboard: Dashboard = new Dashboard(ns, `Scan ${Log.target(input.targetHost, {colorless: true})}`, {icon: '📡', role: 'Worker'});
    dashboard.initTailTitle();
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
    const logger = new Logger(ns);
    if (!targetHost) {
        if (ns.args[0] === undefined) {
            logger.err('Merci de renseigner un hostname');
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
    const repository = new ServersRepository(ns);

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
        let data: ServerData|null = repository.get(parent);
        depth = data?.depth ? data.depth + 1 : null;
    }
    
    // enregistrement des données des serveurs voisins
    for (const newTarget of newTargets) {
        // add to scan targets
        // add to unlock targets
        repository.add(newTarget, parent, depth ?? undefined);
    }

    return true;
}

