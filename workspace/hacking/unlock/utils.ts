import {TargetHost} from 'workspace/hacking/model/TargetHost'
import * as Referentiel from 'workspace/referentiel'
import {Targets} from 'workspace/hacking/model/Targets'
import {getPortPrograms} from 'workspace/hacking/model/PortProgram'

export function getAvailablePortProgram(ns: NS) {
    return getPortPrograms(ns).filter(program => ns.fileExists(program.filename, 'home'));
}

export function getNextTarget(ns: NS): TargetHost|undefined {
    // load targets
    let targets: Targets = JSON.parse(ns.read(Referentiel.TARGETS_REPOSITORY_FILE));

    if (targets.unlockTargets.length === 0) {
        return undefined;
    }

    const availablePortProgram = getAvailablePortProgram(ns);
    const targetOnLvl = targets.unlockTargets
        // load host data
        .map(target => JSON.parse(ns.read(Referentiel.SERVERS_REPOSITORY + `/${target}.json`)) as TargetHost)
        .filter(x => x.unlockRequirements.numOpenPortsRequired as number <= availablePortProgram.length);
    if (targetOnLvl.length > 0) {
        return targetOnLvl.sort((a, b) => (a.unlockRequirements.requiredHackingSkill as number) - (b.unlockRequirements.requiredHackingSkill as number)).shift();
    }

    const portNextTarget = Math.min(...targets.unlockTargets
        // load host data
        .map(target => (JSON.parse(ns.read(Referentiel.SERVERS_REPOSITORY + `/${target}.json`)) as TargetHost).unlockRequirements.numOpenPortsRequired ?? Number.MAX_SAFE_INTEGER)
        );
    
    return targets.unlockTargets
        // load host data
        .map(target => JSON.parse(ns.read(Referentiel.SERVERS_REPOSITORY + `/${target}.json`)) as TargetHost)
        .filter(x => x.unlockRequirements.numOpenPortsRequired === portNextTarget)
        .sort((a, b) => (a.unlockRequirements.requiredHackingSkill as number) - (b.unlockRequirements.requiredHackingSkill as number))[0];
}