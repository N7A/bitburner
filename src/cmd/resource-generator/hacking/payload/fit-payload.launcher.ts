import {getBestPayloadTarget} from 'workspace/resource-generator/hacking/payload/payload.selector'
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'
import { ProcessRequestType } from 'workspace/load-balancer/domain/model/ProcessRequestType';

export async function main(ns: NS) {
    const executionsRepository = new ExecutionsRepository(ns);

    const targetHost: string | undefined = getBestPayloadTarget(ns);

    if (targetHost !== undefined) {
        executionsRepository.add({type: ProcessRequestType.HACK, target: targetHost, weight: 1});
    }
}