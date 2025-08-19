import {getBestPayloadTarget} from 'workspace/resource-generator/hacking/payload/payload.selector'
import * as ExecutionsRepository from 'workspace/load-balancer/domain/executions.repository';
import { ProcessRequestType } from 'workspace/load-balancer/domain/model/ProcessRequest';

export async function main(ns: NS) {
    const targetHost: string | undefined = getBestPayloadTarget(ns);

    if (targetHost !== undefined) {
        ExecutionsRepository.add(ns, {type: ProcessRequestType.HACK, target: targetHost, weight: 1});
    }
}