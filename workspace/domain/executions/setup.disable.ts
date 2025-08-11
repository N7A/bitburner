import * as ExecutionsRepository from 'workspace/domain/executions/executions.repository'
import {ProcessRequestType} from 'workspace/domain/executions/model/ProcessRequest'

export async function main(ns: NS) {
    const input: InputArg = getInput(ns);

    ExecutionsRepository.remove(ns, {type: ProcessRequestType.SETUP_HACK, target: input.hostnameTarget});
}

//#region Input parameters
type InputArg = {
    /** Serveur cible */
    hostnameTarget: string;
}

/**
 * Load input parameters
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
    if (ns.args[0] === undefined) {
        ns.tprint('ERROR', ' ', 'Merci de renseigner un hostname');
        ns.exit();
    }

    return {
        hostnameTarget: (ns.args[0] as string)
    };
}
//#endregion Input parameters
