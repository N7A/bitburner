import {ExecutionResult} from 'workspace/hacking/model/ExecutionResult'
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
    ns.tprint('SUCCESS', ' ', `${targetUnlocked} [unlocked]`);
    
    //#region Spreading
    ns.print('Spreading ', targetUnlocked);
    // copie du toolkit
    await copyToolkit(ns, targetUnlocked);
    //#endregion Spreading
}
