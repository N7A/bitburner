import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest'
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'
import { ShareRamExecution } from 'workspace/resource-generator/faction/model/ShareRamExecution';

export async function main(ns: NS) {
    const executionsRepository = new ExecutionsRepository(ns);

    const request: ProcessRequest = ShareRamExecution.getRequest();

    // si déjà actif
    if (executionsRepository.getAll().some(x => ExecutionsRepository.getHash(request) === ExecutionsRepository.getHash(x))) {
        // on ne fait rien
        return;
    }

    executionsRepository.add(request);
}