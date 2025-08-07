import * as ServersRepository from 'workspace/domain/servers/servers.repository'
import {main as bestHackFitTarget} from 'workspace/hacking/payload/payload.selector'
import * as ExecutionsRepository from 'workspace/domain/executions/executions.repository';
import { OrderType } from 'workspace/domain/executions/model/Order';

export async function main(ns: NS) {
    const targets: string[] = ServersRepository.getAll(ns)
        .map(x => ServersRepository.get(ns, x))
        .filter(x => x.state.unlocked)
        .map(x => x.name);

    const targetHost: string | undefined = await bestHackFitTarget(ns, targets);

    ExecutionsRepository.add(ns, {type: OrderType.HACK, target: targetHost, weight: 1});
}