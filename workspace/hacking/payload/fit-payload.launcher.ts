import {getBestPayloadTarget} from 'workspace/hacking/payload/payload.selector'
import * as ExecutionsRepository from 'workspace/domain/executions/executions.repository';
import { OrderType } from 'workspace/domain/executions/model/Order';

export async function main(ns: NS) {
    const targetHost: string | undefined = getBestPayloadTarget(ns);

    if (targetHost !== undefined) {
        ExecutionsRepository.add(ns, {type: OrderType.HACK, target: targetHost, weight: 1});
    }
}