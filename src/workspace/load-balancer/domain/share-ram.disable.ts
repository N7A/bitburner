import * as ExecusionsRepository from 'workspace/load-balancer/domain/executions.repository'
import {ProcessRequest, ProcessRequestType} from 'workspace/load-balancer/domain/model/ProcessRequest'

export async function main(ns: NS) {
    const shareRamOrder: ProcessRequest = {
        type: ProcessRequestType.SHARE_RAM
    }
    ExecusionsRepository.remove(ns, shareRamOrder);
}