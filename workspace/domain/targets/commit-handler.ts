import * as Referentiel from 'workspace/referentiel'
import { CommitRequest } from "workspace/domain/targets/model/CommitRequest";
import { CommitType } from "workspace/domain/targets/model/CommitType";
import { Targets } from 'workspace/domain/targets/model/Targets';

//#region Constants
export const PORT = 1;
//#endregion Constants

export async function main(ns: NS) {
    while(true) {
        if (ns.peek(PORT) === 'NULL PORT DATA') {
            await ns.nextPortWrite(PORT);
        }

        const commitRequest: CommitRequest = ns.readPort(PORT);

        if (commitRequest.type === CommitType.ADD_SCAN) {
            commitAddScan(ns, commitRequest.data);
        }
    }
}

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
function commitAddScan(ns: NS, hostnames: string[]) {
    // get last version
    let targets: Targets = get(ns);

    if (hostnames.every(hostname => targets.scanTargets.includes(hostname))) {
        return;
    }
    
    // add to owned servers
    targets.scanTargets = Array.from(new Set([...targets.scanTargets, ...hostnames]));
    
    // save data
    resetWith(ns, targets);

    ns.tprint('INFO', ' ', 'New targets to scan : ' + hostnames);
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
