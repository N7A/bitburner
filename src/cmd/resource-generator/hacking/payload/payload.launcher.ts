import { ProcessRequestType } from 'workspace/load-balancer/domain/model/ProcessRequestType';
import { getPayloadTargets } from 'workspace/resource-generator/hacking/payload/payload.selector';
import { ExecutionOrdersService } from 'workspace/load-balancer/execution-orders.service';
import { PayloadExecution } from 'workspace/resource-generator/hacking/model/PayloadExecution';

/**
 * Hack les cibles données par le unlock.
 */
export async function main(ns: NS) {
    const executionOrdersService = new ExecutionOrdersService(ns);

    // load targets
    const currentExecutions: string[] = (await executionOrdersService.getAll())
        .filter(x => x.type === ProcessRequestType.HACK)
        .map(x => x.id)
        .filter(x => x !== undefined) as string[];
    const targets: string[] = getPayloadTargets(ns)
        .filter(x => !currentExecutions.includes(x));
    
    for (const target of targets) {
        executionOrdersService.add(PayloadExecution.getRequest(ns, target));
    }

    // TODO : run execution.scheduler if not running
}
