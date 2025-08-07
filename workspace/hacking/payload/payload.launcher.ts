import * as Log from 'workspace/frameworks/logging';
import * as TargetsRepository from 'workspace/domain/targets/targets.repository';
import * as ExecutionsRepository from 'workspace/domain/executions/executions.repository';
import { OrderType } from 'workspace/domain/executions/model/Order';

/**
 * Hack les cibles données par le unlock.
 */
export async function main(ns: NS) {
    // load targets
    var targets: string[] = Array.from(new Set(TargetsRepository.get(ns).hackTargets));
    for (const target of targets) {
        ns.print(Log.getStartLog());
        ns.print(`START ${Log.action('Payload')} ${Log.target(target)}`);

        // remove from hack targets
        TargetsRepository.removeHack(ns, target);

        ExecutionsRepository.add(ns, {type: OrderType.HACK, target: target, weight: 1});

        ns.print(`END ${Log.action('Payload')} ${Log.target(target)}`);
        ns.print(Log.getEndLog());
    }
}
