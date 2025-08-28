import { ProcessRequestType } from 'workspace/load-balancer/domain/model/ProcessRequestType'
import { TerminalLogger } from 'workspace/socle/TerminalLogger';
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'

export async function main(ns: NS) {
    const input: InputArg = getInput(ns);

    const executionsRepository = new ExecutionsRepository(ns);

    executionsRepository.remove({type: ProcessRequestType.SETUP_HACK, target: input.hostnameTarget});
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
