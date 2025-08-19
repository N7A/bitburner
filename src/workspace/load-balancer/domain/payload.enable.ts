import * as ExecutionsRepository from 'workspace/load-balancer/domain/executions.repository'
import {ProcessRequestType} from 'workspace/load-balancer/domain/model/ProcessRequest'

export async function main(ns: NS) {
    const input: InputArg = getInput(ns);

    // si déjà actif
    if (ExecutionsRepository.getAll(ns).some(x => x.type === ProcessRequestType.HACK && x.target === input.hostnameTarget)) {
        // on ne fait rien
        return;
    }

    ExecutionsRepository.add(ns, {type: ProcessRequestType.HACK, target: input.hostnameTarget, weight: 1});
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
