import { CommitRequest } from "lab/repo-broker/model/CommitRequest";
import { CommitType } from "lab/repo-broker/model/CommitType";

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
 * Enregistre en base un nouveau serveur à scanner.
 * 
 * @param ns Bitburner API
 * @param hostname serveur à ajouter
 */
function commitAddScan(ns: NS, hostnames: string[]) {
    // TODO : add scan
}

