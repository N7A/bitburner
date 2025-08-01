import {Targets} from 'workspace/domain/targets/model/Targets'
import * as TargetsRepository from 'workspace/domain/targets/targets.repository'
import * as ServersRepository from 'workspace/domain/servers/servers.repository'
import { ServerData } from 'workspace/domain/servers/model/ServerData'

export function getUnlockTarget(ns: NS): string[] {
    // load targets
    const targets: Targets = TargetsRepository.get(ns);
    return targets.unlockTargets
            // load host data
            .map(target => ServersRepository.get(ns, target) as ServerData)
            .sort((a, b) => (a.unlockRequirements.requiredHackingSkill as number) - (b.unlockRequirements.requiredHackingSkill as number))
            .map(x => x.name);
}