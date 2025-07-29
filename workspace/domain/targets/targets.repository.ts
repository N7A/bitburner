import * as Referentiel from 'workspace/referentiel'
import { Targets } from 'workspace/hacking/model/Targets';
import * as OwnedServersRepository from 'workspace/domain/owned-servers.repository';

/**
 * Récupère les cibles enregistrés en base de donnée.
 * 
 * @param ns Bitburner API
 */
export function get(ns: NS) {
    return JSON.parse(ns.read(Referentiel.TARGETS_REPOSITORY_FILE)) as Targets;
}

/**
 * Enregistre en base un nouveau serveur à scanner.
 * 
 * @param ns Bitburner API
 * @param hostname serveur à ajouter
 */
export function addScan(ns: NS, hostname: string) {
    // get last version
    let targets: Targets = get(ns);

    // add to owned servers
    targets.scanTargets.push(hostname);
    
    // save data
    resetWith(ns, targets);
}

/**
 * Enregistre en base un nouveau serveur à scanner.
 * 
 * @param ns Bitburner API
 * @param hostname serveur à ajouter
 */
export function removeScan(ns: NS, hostname: string) {
    // get last version
    let targets: Targets = get(ns);

    // remove from scan targets
    targets.scanTargets = targets.scanTargets.filter(x => x !== hostname);
    
    // save data
    resetWith(ns, targets);
}

/**
 * Enregistre en base un nouveau serveur à débloquer.
 * 
 * @param ns Bitburner API
 * @param hostname serveur à ajouter
 */
export function addUnlock(ns: NS, hostname: string[]) {
    // get last version
    let targets: Targets = get(ns);

    // add to owned servers
    targets.unlockTargets.push(...hostname);
    
    // save data
    resetWith(ns, targets);
}

/**
 * Enregistre en base un nouveau serveur à scanner.
 * 
 * @param ns Bitburner API
 * @param hostname serveur à ajouter
 */
export function removeUnlock(ns: NS, hostname: string) {
    // get last version
    let targets: Targets = get(ns);

    // remove from scan targets
    targets.unlockTargets = targets.unlockTargets.filter(x => x !== hostname);
    
    // save data
    resetWith(ns, targets);
}

/**
 * Enregistre en base un nouveau serveur à hacker.
 * 
 * @param ns Bitburner API
 * @param hostname serveur à ajouter
 */
export function addHack(ns: NS, hostname: string) {
    // get last version
    let targets: Targets = get(ns);

    // add to owned servers
    targets.hackTargets.push(hostname);
    
    // save data
    resetWith(ns, targets);
}

/**
 * Enregistre en base un nouveau serveur à scanner.
 * 
 * @param ns Bitburner API
 * @param hostname serveur à ajouter
 */
export function removeHack(ns: NS, hostname: string) {
    // get last version
    let targets: Targets = get(ns);

    // remove from scan targets
    targets.hackTargets = targets.hackTargets.filter(x => x !== hostname);
    
    // save data
    resetWith(ns, targets);
}

/**
 * Remise à zéro de la base de donnée.
 * 
 * @param ns Bitburner API
 */
export function reset(ns: NS) {
    const targets: Targets = {
        scanTargets: ['home', ...OwnedServersRepository.getAll(ns).map(server => server.hostname)],
        unlockTargets: [],
        hackTargets: []
    }

    // save data
    resetWith(ns, targets);
}

/**
 * Remise à zéro de la base de donnée.
 * 
 * @param ns Bitburner API
 */
export function resetHack(ns: NS) {
    // get last version
    let targets: Targets = get(ns);
    
    targets.hackTargets.push(
        ...getAllHostname(ns)
            .filter(server => !targets.unlockTargets.includes(server) && !targets.hackTargets.includes(server))
    );
    
    ns.tprint('New hack targets :', targets.hackTargets);

    // save data
    resetWith(ns, targets);
}

function getAllHostname(ns: NS) {
    return ns.ls('home', Referentiel.SERVERS_REPOSITORY)
        .filter(x => x.startsWith(Referentiel.SERVERS_REPOSITORY))
        .map(x => x.substring(x.lastIndexOf('/')+1, x.lastIndexOf('.json')));
}

/**
 * Remet à zéro la base de donnée avec les cibles fournis en entrée.
 * 
 * @param ns Bitburner API
 * @param targets cibles à sauvegarder
 */
function resetWith(ns: NS, targets: Targets) {
    ns.write(Referentiel.TARGETS_REPOSITORY_FILE, JSON.stringify(targets, null, 4), "w");
}
