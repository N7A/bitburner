import {ProcessRequest, ProcessRequestType} from 'workspace/load-balancer/domain/model/ProcessRequest'
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'

export async function main(ns: NS) {
    const executionsRepository = new ExecutionsRepository(ns);

    // si déjà actif
    if (executionsRepository.getAll().some(x => x.type === ProcessRequestType.SHARE_RAM)) {
        // on ne fait rien
        return;
    }

    const shareRamOrder: ProcessRequest = {
        type: ProcessRequestType.SHARE_RAM
    }
    executionsRepository.add(shareRamOrder);
}