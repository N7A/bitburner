import { ProcessRequestType } from 'workspace/load-balancer/domain/model/ProcessRequestType'
import { TerminalLogger } from 'workspace/common/TerminalLogger';
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'

export async function main(ns: NS) {
    const input: InputArg = getInput(ns);

    const executionsRepository = new ExecutionsRepository(ns);

    // si déjà actif
    if (executionsRepository.getAll().some(x => x.type === ProcessRequestType.HACK && x.target === input.hostnameTarget)) {
        // on ne fait rien
        return;
    }

    executionsRepository.add({type: ProcessRequestType.HACK, target: input.hostnameTarget, weight: 1});
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
    const logger = new TerminalLogger(ns);
    if (ns.args[0] === undefined) {
        logger.err('Merci de renseigner un hostname');
        ns.exit();
    }

    return {
        hostnameTarget: (ns.args[0] as string)
    };
}
//#endregion Input parameters
