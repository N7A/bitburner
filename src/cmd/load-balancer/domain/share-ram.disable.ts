import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest'
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'
import * as Referentiel from 'workspace/referentiel'
import { ShareRamExecution } from 'workspace/resource-generator/faction/model/ShareRamExecution';

//#region Constants
const SHARE_SCRIPT = Referentiel.FACTION_DIRECTORY + '/' + 'share-ram.daemon.ts';
//#endregion Constants

export async function main(ns: NS) {
    const executionsRepository = new ExecutionsRepository(ns);

    const request: ProcessRequest = ShareRamExecution.getRequest();
    executionsRepository.remove(request);
}