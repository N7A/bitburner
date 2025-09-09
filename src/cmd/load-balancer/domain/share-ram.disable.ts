import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest'
import * as Referentiel from 'workspace/referentiel'
import { ShareRamExecution } from 'workspace/resource-generator/faction/model/ShareRamExecution';
import { ExecutionOrdersService } from 'workspace/load-balancer/execution-orders.service';

//#region Constants
const SHARE_SCRIPT = Referentiel.FACTION_DIRECTORY + '/' + 'share-ram.daemon.ts';
//#endregion Constants

export async function main(ns: NS) {
    const executionOrdersService = new ExecutionOrdersService(ns);

    const request: ProcessRequest = ShareRamExecution.getRequest();
    executionOrdersService.remove(request);
}