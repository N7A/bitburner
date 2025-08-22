import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest'
import { ProcessRequestType } from 'workspace/load-balancer/domain/model/ProcessRequestType'
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'

export async function main(ns: NS) {
    const executionsRepository = new ExecutionsRepository(ns);

    const shareRamOrder: ProcessRequest = {
        type: ProcessRequestType.SHARE_RAM
    }
    executionsRepository.remove(shareRamOrder);
}