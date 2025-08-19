import { ServersService } from 'workspace/servers/servers.service';
import { ServersRepository } from 'workspace/servers/domain/servers.repository'
import { ServerData } from 'workspace/servers/domain/model/ServerData'
import {getAvailablePortProgram} from 'workspace/resource-generator/hacking/unlock/open-ports.worker'

export function getUnlockTarget(ns: NS): string[] {
    // load targets
    const targets: string[] = ServersService.getAllLocked(ns);
    return targets.map(target => ServersRepository.get(ns, target) as ServerData)
            .sort((a, b) => (a.unlockRequirements.requiredHackingSkill as number) - (b.unlockRequirements.requiredHackingSkill as number))
            .map(x => x.name);
}

export function getNextTarget(ns: NS): ServerData|undefined {
    // load targets
    let targets: string[] = getUnlockTarget(ns);

    if (targets.length === 0) {
        return undefined;
    }

    const availablePortProgram = getAvailablePortProgram(ns);
    const targetOnLvl = targets
        // load host data
        .map(target => ServersRepository.get(ns, target) as ServerData)
        .filter(x => x.unlockRequirements.numOpenPortsRequired as number <= availablePortProgram.length);
    if (targetOnLvl.length > 0) {
        return targetOnLvl.sort((a, b) => (a.unlockRequirements.requiredHackingSkill as number) - (b.unlockRequirements.requiredHackingSkill as number)).shift();
    }

    const portNextTarget = Math.min(...targets
        // load host data
        .map(target => (ServersRepository.get(ns, target) as ServerData).unlockRequirements.numOpenPortsRequired ?? Number.MAX_SAFE_INTEGER)
        );
    
    return targets
        // load host data
        .map(target => ServersRepository.get(ns, target) as ServerData)
        .filter(x => x.unlockRequirements.numOpenPortsRequired === portNextTarget)
        .sort((a, b) => (a.unlockRequirements.requiredHackingSkill as number) - (b.unlockRequirements.requiredHackingSkill as number))[0];
}