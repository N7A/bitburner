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

    if (targets.scanTargets.includes(hostname)) {
        return;
    }
    
    // add to owned servers
    targets.scanTargets = Array.from(new Set([...targets.scanTargets, hostname]));
    
    // save data
    resetWith(ns, targets);

    ns.tprint('INFO', ' ', 'New target to scan : ' + hostname);
}

/**
 * Enregistre en base un nouveau serveur à scanner.
 * 
 * @param ns Bitburner API
 * @param hostname serveur à ajouter
 */
export function addHackable(ns: NS, hostname: string) {
    // get last version
    let targets: Targets = get(ns);

    if (targets.hackableTagrets.includes(hostname)) {
        return;
    }
    
    // add to owned servers
    targets.hackableTagrets = Array.from(new Set([...targets.hackableTagrets, hostname]));
    
    // save data
    resetWith(ns, targets);

    ns.tprint('INFO', ' ', 'New target hackable : ' + hostname);
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

    const indexToRemove = targets.scanTargets.indexOf(hostname);
    if (indexToRemove === -1) {
        return;
    }
    
    // remove from scan targets
    targets.scanTargets.splice(indexToRemove, 1);
    
    // save data
    resetWith(ns, targets);

    ns.tprint('INFO', ' ', 'Remove target to scan : ' + hostname);
}

/**
 * Enregistre en base un nouveau serveur à débloquer.
 * 
 * @param ns Bitburner API
 * @param hostnames serveur à ajouter
 */
export function addUnlock(ns: NS, hostnames: string[]) {
    // get last version
    let targets: Targets = get(ns);

    if (hostnames.every(hostname => targets.unlockTargets.includes(hostname))) {
        return;
    }
    
    // add to owned servers
    targets.unlockTargets = Array.from(new Set([...targets.unlockTargets, ...hostnames]));
    
    // save data
    resetWith(ns, targets);

    ns.tprint('INFO', ' ', 'New target to unlock : ' + hostnames);
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

    const indexToRemove = targets.unlockTargets.indexOf(hostname);
    if (indexToRemove === -1) {
        return;
    }
    
    // remove from targets
    targets.unlockTargets.splice(indexToRemove, 1);
    
    // save data
    resetWith(ns, targets);

    ns.tprint('INFO', ' ', 'Remove target to unlock : ' + hostname);
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

    if (targets.hackTargets.includes(hostname)) {
        return;
    }
    
    // add to owned servers
    targets.hackTargets = Array.from(new Set([...targets.hackTargets, hostname]));
    
    // save data
    resetWith(ns, targets);

    ns.tprint('INFO', ' ', 'New target to hack : ' + hostname);
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

    const indexToRemove = targets.hackTargets.indexOf(hostname);
    if (indexToRemove === -1) {
        return;
    }
    
    // remove from scan targets
    targets.hackTargets.splice(indexToRemove, 1);
    
    // save data
    resetWith(ns, targets);

    ns.tprint('INFO', ' ', 'Remove target to hack : ' + hostname);
}

/**
 * Remise à zéro de la base de donnée.
 * 
 * @param ns Bitburner API
 */
export function reset(ns: NS) {
    const targets: Targets = {
        scanTargets: [...OwnedServersRepository.getAll(ns).map(server => server.hostname)],
        unlockTargets: [],
        hackTargets: [],
        hackableTagrets: []
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
    
    targets.hackTargets = 
        Array.from(new Set([...targets.hackTargets,
            ...targets.hackableTagrets
            .filter(server => !targets.unlockTargets.includes(server))
        ]));
    
    ns.tprint('New hack targets :', targets.hackTargets);

    // save data
    resetWith(ns, targets);
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
