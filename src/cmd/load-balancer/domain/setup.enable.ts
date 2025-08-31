import { ProcessRequestType } from 'workspace/load-balancer/domain/model/ProcessRequestType'
import { Logger } from 'workspace/socle/Logger';
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'
import { ServersRepository } from 'workspace/servers/domain/servers.repository'

export async function main(ns: NS) {
    const input: InputArg = await getInput(ns);

    const logger = new Logger(ns);
    const executionsRepository = new ExecutionsRepository(ns);

    // si déjà actif
    if (executionsRepository.getAll().some(x => x.type === ProcessRequestType.SETUP_HACK && x.target === input.hostnameTarget)) {
        logger.warn(`Setup ${input.hostnameTarget} already enabled`);
        // on ne fait rien
        return;
    }

    executionsRepository.add({type: ProcessRequestType.SETUP_HACK, target: input.hostnameTarget, weight: 1});
    logger.success(`Setup ${input.hostnameTarget} [enabled]`);
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
async function getInput(ns: NS): Promise<InputArg> {
    let hostnameTarget: string;
    if (ns.args[0] === undefined) {
        const repository = new ServersRepository(ns);
        
        hostnameTarget = await ns.prompt('Merci de renseigner un hostname', { type: "select", choices: repository.getAllIds() }) as string
    } else {
        hostnameTarget = (ns.args[0] as string);
    }

    return {
        hostnameTarget: hostnameTarget
    };
}
//#endregion Input parameters
