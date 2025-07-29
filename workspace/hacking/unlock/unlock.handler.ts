import {ExecutionResult} from 'workspace/hacking/model/ExecutionResult'
import * as TargetsRepository from 'workspace/domain/targets/targets.repository'
import { main as copyToolkit } from 'workspace/hacking/spreading/copy-toolkit.launcher'

//#region Constants
export const PORT = 1;
//#endregion Constants

export async function main(ns: NS) {
    // TODO : count waited result to stop loop when no more need ?
    while(true) {
        if (ns.peek(PORT) === 'NULL PORT DATA') {
            await ns.nextPortWrite(PORT);
        }

        // vérification de l'execution du script
        const executionResult: ExecutionResult = ns.readPort(PORT);

        if (!executionResult.result) {
            ns.print('ERROR', ' ', executionResult.id, ' : ', 'Nuke KO')
            continue;
        }

        await handleUnlock(ns, executionResult.id);
    }
}

async function handleUnlock(ns: NS, targetUnlocked: string) {
    //#region Spreading
    ns.print('Spreading ', targetUnlocked);
    // copie du toolkit
    await copyToolkit(ns, targetUnlocked);
    //#endregion Spreading
    
    saveUnlocked(ns, targetUnlocked);

    ns.tprint('SUCCESS', ' ', `${targetUnlocked} [unlocked]`);

    ns.tprint('INFO', ' ', 'New target to scan : ' + targetUnlocked);
}

/**
 * Enregistre en base le fait qu'on ai débloqué la cible ainsi que les nouvelles cibles accessibles.
 */
function saveUnlocked(ns: NS, targetUnlocked: string) {
    // remove from unlock targets
    TargetsRepository.removeUnlock(ns, targetUnlocked) ;

    // add to hack targets
    TargetsRepository.addHack(ns, targetUnlocked);
    
    // add to hackable targets
    TargetsRepository.addHackable(ns, targetUnlocked);
    
    // add to scan targets
    TargetsRepository.addScan(ns, targetUnlocked);
}