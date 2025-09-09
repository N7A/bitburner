import {getBestPayloadTarget} from 'workspace/resource-generator/hacking/payload/payload.selector'
import { ExecutionOrdersService } from 'workspace/load-balancer/execution-orders.service';
import { PayloadExecution } from 'workspace/resource-generator/hacking/model/PayloadExecution';

export async function main(ns: NS) {
    const executionOrdersService = new ExecutionOrdersService(ns);

    const targetHost: string | undefined = getBestPayloadTarget(ns);

    if (targetHost !== undefined) {
        executionOrdersService.add(PayloadExecution.getRequest(ns, targetHost));
    }
}