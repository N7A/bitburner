import { Logger } from 'workspace/socle/Logger';
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'
import { ServersRepository } from 'workspace/servers/domain/servers.repository'
import { PayloadExecution } from 'workspace/resource-generator/hacking/model/PayloadExecution';

export async function main(ns: NS) {
    const input: InputArg = await getInput(ns);

    const logger = new Logger(ns);
    const executionsRepository = new ExecutionsRepository(ns);

    const request = PayloadExecution.getRequest(ns, input.hostnameTarget);

    executionsRepository.remove(request);
    logger.success(`Hack ${input.hostnameTarget} [disabled]`);
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
