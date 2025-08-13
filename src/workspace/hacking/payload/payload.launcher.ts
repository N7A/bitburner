import * as ExecutionsRepository from 'workspace/domain/executions/executions.repository';
import { ProcessRequestType } from 'workspace/domain/executions/model/ProcessRequest';
import { getPayloadTargets } from 'workspace/hacking/payload/payload.selector';

/**
 * Hack les cibles données par le unlock.
 */
export async function main(ns: NS) {
    // load targets
    const currentExecutions: string[] = ExecutionsRepository.getAll(ns)
        .filter(x => x.type === ProcessRequestType.HACK)
        .map(x => x.target)
        .filter(x => x !== undefined) as string[];
    const targets: string[] = getPayloadTargets(ns)
        .filter(x => !currentExecutions.includes(x));
    
    for (const target of targets) {
        ExecutionsRepository.add(ns, {type: ProcessRequestType.HACK, target: target, weight: 1});
    }

    // TODO : run execution.scheduler if not running
}
