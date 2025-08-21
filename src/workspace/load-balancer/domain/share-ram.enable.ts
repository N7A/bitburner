import * as ExecusionsRepository from 'workspace/load-balancer/domain/executions.repository'
import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest'
import { ProcessRequestType } from 'workspace/load-balancer/domain/model/ProcessRequestType'

export async function main(ns: NS) {
    // si déjà actif
    if (ExecusionsRepository.getAll(ns).some(x => x.type === ProcessRequestType.SHARE_RAM)) {
        // on ne fait rien
        return;
    }

    const shareRamOrder: ProcessRequest = {
        type: ProcessRequestType.SHARE_RAM
    }
    ExecusionsRepository.add(ns, shareRamOrder);
}