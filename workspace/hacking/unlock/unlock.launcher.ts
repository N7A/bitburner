import * as Referentiel from 'workspace/referentiel'
import * as Log from 'workspace/logging-framework/main'
import {get as TargetsRepositoryGet} from 'workspace/domain/targets/targets.repository'
import {TargetHost} from 'workspace/hacking/model/TargetHost'
import { getUnlockTarget } from 'workspace/hacking/unlock/unlock.selector'

//#region Constants
const UNLOCK_WORKER_SCRIPT = Referentiel.HACKING_DIRECTORY + '/unlock/unlock.worker.ts';
const UNLOCK_HANDLER_SCRIPT = Referentiel.HACKING_DIRECTORY + '/unlock/unlock.handler.ts';
//#endregion Constants

/**
 * Donne l'accès root aux cibles données par le scan, 
 * si le niveau de hacking et les ports opener sont suffisant.
 */
export async function main(ns: NS) {
    // load target files
    let targetsHostname: string[] = getUnlockTarget(ns);

    let unlockLaunched: string[] = [];
    
    //#region accès root
    for (const targetHostname of targetsHostname) {
        ns.print(Log.getStartLog())
        ns.print('START [Unlock] ', targetHostname);

        // TODO : wait until ram dispo
        var pidUnlock: number = ns.run(UNLOCK_WORKER_SCRIPT, 1, targetHostname);

        if (pidUnlock === 0) {
            ns.print('ERROR', ' ', targetHostname, ' : ', 'Nuke KO')
            continue;
        }

        unlockLaunched.push(targetHostname);
        ns.print(Log.getEndLog())
    }

    if(unlockLaunched.length > 0) {
        if (!ns.isRunning(UNLOCK_HANDLER_SCRIPT, 'home')) {
            ns.exec(UNLOCK_HANDLER_SCRIPT, 'home');
        }
    }
    //#endregion

}
