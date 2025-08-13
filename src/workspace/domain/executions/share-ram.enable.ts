import * as ExecusionsRepository from 'workspace/domain/executions/executions.repository'
import {ProcessRequest, ProcessRequestType} from 'workspace/domain/executions/model/ProcessRequest'

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