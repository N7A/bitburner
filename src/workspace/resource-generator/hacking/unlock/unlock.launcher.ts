import * as Referentiel from 'workspace/referentiel'
import * as Log from 'workspace/socle/logging';
import { getUnlockTarget } from 'workspace/resource-generator/hacking/unlock/unlock.selector'
import { waitEndExecution } from 'workspace/socle/execution'

//#region Constants
const UNLOCK_WORKER_SCRIPT = Referentiel.HACKING_DIRECTORY + '/unlock/unlock.worker.ts';
//#endregion Constants

/**
 * Donne l'accès root aux cibles données par le scan, 
 * si le niveau de hacking et les ports opener sont suffisant.
 */
export async function main(ns: NS) {
    // load target files
    const targets: string[] = getUnlockTarget(ns);
    
    let unlockLaunched: number[] = [];

    //#region accès root
    for (const targetHostname of targets) {
        ns.print(Log.getStartLog())
        ns.print(`START ${Log.action('Unlock')} ${Log.target(targetHostname)}`);

        // TODO : wait until ram dispo
        var pidUnlock: number = ns.run(UNLOCK_WORKER_SCRIPT, 1, targetHostname);

        if (pidUnlock === 0) {
            ns.print('ERROR', ' ', targetHostname, ' : ', 'Nuke KO')
            continue;
        }

        unlockLaunched.push(pidUnlock);
        ns.print(`END ${Log.action('Unlock')} ${Log.target(targetHostname)}`);
        ns.print(Log.getEndLog())
    }
    //#endregion
    
    for (const pid of unlockLaunched) {
        await waitEndExecution(ns, pid);
    }
}
