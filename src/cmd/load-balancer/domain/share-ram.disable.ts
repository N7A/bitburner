import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest'
import { ShareRamExecution } from 'workspace/resource-generator/faction/model/ShareRamExecution';
import { ExecutionOrdersService } from 'workspace/load-balancer/execution-orders.service';

export async function main(ns: NS) {
    const executionOrdersService = new ExecutionOrdersService(ns);

    const request: ProcessRequest = ShareRamExecution.getRequest();
    executionOrdersService.remove(request);
}