import {ProcessRequest, ProcessRequestType} from 'workspace/load-balancer/domain/model/ProcessRequest'
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'

export async function main(ns: NS) {
    const executionsRepository = new ExecutionsRepository(ns);

    const shareRamOrder: ProcessRequest = {
        type: ProcessRequestType.SHARE_RAM
    }
    executionsRepository.remove(shareRamOrder);
}