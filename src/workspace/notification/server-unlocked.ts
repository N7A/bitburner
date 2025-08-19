import { ServersRepository } from 'workspace/servers/domain/servers.repository';
import * as Log from 'workspace/frameworks/logging';

export async function main(ns: NS) {
    const input: InputArg = getInput(ns);

    const startTime: Date = new Date();
    while(!ServersRepository.get(ns, input.targetHostname)?.state.unlocked) {
        await ns.sleep(500);
    }
    const endTime: Date = new Date();
    
    const duration = new Date(endTime.getTime() - startTime.getTime())

    ns.alert('Serveur ' 
        + `> ${input.targetHostname} <`
        + ' unlocked en ' + Log.date(ns, duration) + '\n'
        + '(Demandé à ' + Log.date(ns, startTime) + ')'
    );
}

//#region Input parameters
type InputArg = {
    /** Serveur surveillé */
    targetHostname: string;
}

/**
 * Load input parameters
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
    if (ns.args[0] === undefined) {
        ns.tprint('ERROR', ' ', 'Merci de renseigner un serveur à notifier');
        ns.exit();
    }
    
    return {
        targetHostname: (ns.args[0] as string)
    };
}
//#endregion Input parameters
