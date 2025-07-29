import * as Referentiel from 'workspace/referentiel'
import * as Log from 'workspace/logging-framework/main'
import {get as TargetsRepositoryGet} from 'workspace/domain/targets/targets.repository'

//#region Constants
const UNLOCK_WORKER_SCRIPT = Referentiel.HACKING_DIRECTORY + '/unlock/unlock.worker.ts';
const UNLOCK_HANDLER_SCRIPT = Referentiel.HACKING_DIRECTORY + '/unlock/unlock.handler.ts';
//#endregion Constants

/**
 * Donne l'accès root aux cibles données par le scan, 
 * si le niveau de hacking et les ports opener sont suffisant.
 */
export async function main(ns: NS) {
    ns.print(Log.getStartLog())
    // load target files
    let targetsHostname: string[] = TargetsRepositoryGet(ns).unlockTargets;

    let unlockLaunched: string[] = [];
    //#region accès root
    for (const targetHostname of targetsHostname) {
        ns.print('START [Unlock] ', targetHostname);

        var pidUnlock: number = ns.run(UNLOCK_WORKER_SCRIPT, 1, targetHostname);

        if (pidUnlock === 0) {
            ns.print('ERROR', ' ', targetHostname, ' : ', 'Nuke KO')
            continue;
        }

        unlockLaunched.push(targetHostname);
    }
    
    if(unlockLaunched.length > 0) {
        if (!ns.isRunning(UNLOCK_HANDLER_SCRIPT, 'home')) {
            ns.exec(UNLOCK_HANDLER_SCRIPT, 'home');
        }
    }
    //#endregion

    ns.print(Log.getEndLog())
}
