import * as ExecusionsRepository from 'workspace/domain/executions/executions.repository'
import {ProcessRequest, ProcessRequestType} from 'workspace/domain/executions/model/ProcessRequest'

export async function main(ns: NS) {
    const shareRamOrder: ProcessRequest = {
        type: ProcessRequestType.SHARE_RAM
    }
    ExecusionsRepository.remove(ns, shareRamOrder);
}