import { Targets } from 'workspace/domain/targets/model/Targets';
import * as TargetsRepository from 'workspace/domain/targets/targets.repository'
import { ServersRepository } from 'workspace/domain/servers/servers.repository'
import { ServerData } from 'workspace/domain/servers/model/ServerData'
import * as Referentiel from 'workspace/referentiel'
import {getAvailablePortProgram} from 'workspace/hacking/unlock/open-ports.worker'

export function getUnlockTarget(ns: NS): string[] {
    // load targets
    const targets: Targets = TargetsRepository.get(ns);
    return targets.unlockTargets
            // load host data
            .map(target => ServersRepository.get(ns, target) as ServerData)
            .sort((a, b) => (a.unlockRequirements.requiredHackingSkill as number) - (b.unlockRequirements.requiredHackingSkill as number))
            .map(x => x.name);
}

export function getNextTarget(ns: NS): ServerData|undefined {
    // load targets
    let targets: Targets = JSON.parse(ns.read(Referentiel.TARGETS_REPOSITORY_FILE));

    if (targets.unlockTargets.length === 0) {
        return undefined;
    }

    const availablePortProgram = getAvailablePortProgram(ns);
    const targetOnLvl = targets.unlockTargets
        // load host data
        .map(target => JSON.parse(ns.read(Referentiel.SERVERS_REPOSITORY + `/${target}.json`)) as ServerData)
        .filter(x => x.unlockRequirements.numOpenPortsRequired as number <= availablePortProgram.length);
    if (targetOnLvl.length > 0) {
        return targetOnLvl.sort((a, b) => (a.unlockRequirements.requiredHackingSkill as number) - (b.unlockRequirements.requiredHackingSkill as number)).shift();
    }

    const portNextTarget = Math.min(...targets.unlockTargets
        // load host data
        .map(target => (JSON.parse(ns.read(Referentiel.SERVERS_REPOSITORY + `/${target}.json`)) as ServerData).unlockRequirements.numOpenPortsRequired ?? Number.MAX_SAFE_INTEGER)
        );
    
    return targets.unlockTargets
        // load host data
        .map(target => JSON.parse(ns.read(Referentiel.SERVERS_REPOSITORY + `/${target}.json`)) as ServerData)
        .filter(x => x.unlockRequirements.numOpenPortsRequired === portNextTarget)
        .sort((a, b) => (a.unlockRequirements.requiredHackingSkill as number) - (b.unlockRequirements.requiredHackingSkill as number))[0];
}