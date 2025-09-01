import { ProcessRequestType } from 'workspace/load-balancer/domain/model/ProcessRequestType';
import { getPayloadTargets } from 'workspace/resource-generator/hacking/payload/payload.selector';
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'
import { PayloadExecution } from 'workspace/resource-generator/hacking/model/PayloadExecution';

/**
 * Hack les cibles données par le unlock.
 */
export async function main(ns: NS) {
    const executionsRepository = new ExecutionsRepository(ns);

    // load targets
    const currentExecutions: string[] = executionsRepository.getAll()
        .filter(x => x.type === ProcessRequestType.HACK)
        .map(x => x.id)
        .filter(x => x !== undefined) as string[];
    const targets: string[] = getPayloadTargets(ns)
        .filter(x => !currentExecutions.includes(x));
    
    for (const target of targets) {
        executionsRepository.add(PayloadExecution.getRequest(ns, target));
    }

    // TODO : run execution.scheduler if not running
}
