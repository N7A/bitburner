import {getBestPayloadTarget} from 'workspace/resource-generator/hacking/payload/payload.selector'
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'
import { PayloadExecution } from 'workspace/resource-generator/hacking/model/PayloadExecution';

export async function main(ns: NS) {
    const executionsRepository = new ExecutionsRepository(ns);

    const targetHost: string | undefined = getBestPayloadTarget(ns);

    if (targetHost !== undefined) {
        executionsRepository.add(PayloadExecution.getRequest(ns, targetHost));
    }
}