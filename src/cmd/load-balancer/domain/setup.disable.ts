import { Logger } from 'workspace/socle/Logger';
import { ServersRepository } from 'workspace/servers/domain/servers.repository'
import { SetupHackExecution } from 'workspace/resource-generator/hacking/model/SetupExecution';
import { ExecutionOrdersService } from 'workspace/load-balancer/execution-orders.service';

export async function main(ns: NS) {
    const input: InputArg = await getInput(ns);

    const logger = new Logger(ns);
    const executionOrdersService = new ExecutionOrdersService(ns);

    const request = SetupHackExecution.getRequest(input.hostnameTarget);

    await executionOrdersService.remove(request);
    logger.success(`Setup ${input.hostnameTarget} [disabled]`);
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
