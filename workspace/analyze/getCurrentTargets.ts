import * as Referentiel from 'workspace/referentiel'
import {TargetHost} from 'workspace/hacking/model/TargetHost'
import {Targets} from 'workspace/hacking/model/Targets'
import * as Log from 'workspace/frameworks/logging'
import {getNextTarget} from 'workspace/hacking/unlock/utils'
import {getPortPrograms} from 'workspace/hacking/model/PortProgram'

export async function main(ns: NS) {
    // load target files
    let targets: TargetHost[] = Array.from((JSON.parse(ns.read(Referentiel.TARGETS_REPOSITORY_FILE)) as Targets).unlockTargets)
        // load host data
        .map(target => JSON.parse(ns.read(Referentiel.SERVERS_REPOSITORY + `/${target}.json`)) as TargetHost)
        .sort((a, b) => (a.unlockRequirements.requiredHackingSkill as number) - (b.unlockRequirements.requiredHackingSkill as number))
        .reverse();

    // TODO : formater en tableau
	ns.tprint(Log.getStartLog());
    for (const data of targets) {
        ns.tprint(Log.color(data.name, Log.Color.CYAN));
        ns.tprint('    ', Log.INFO('Required open port', getRemaning(ns, data)));
        ns.tprint('    ', Log.color('Required hacking skill : ', Log.Color.MAGENTA), data.unlockRequirements.requiredHackingSkill);
        ns.tprint(Log.color('----------', Log.Color.WHITE))
    }
    ns.tprint(Log.color('Nombre de cible : ', Log.Color.MAGENTA), targets.length);
    ns.tprint(Log.color('Nombre de port opener : ', Log.Color.MAGENTA), getPortPrograms(ns)
        .filter(x => ns.fileExists(x.filename)).length);
    ns.tprint(Log.color('Hacking skill : ', Log.Color.MAGENTA), ns.getPlayer().skills.hacking);
    ns.tprint(Log.INFO('Next target', getNextTarget(ns)?.name));
	ns.tprint(Log.getEndLog());
}

function getRemaning(ns: NS, data: TargetHost) {
    return Math.max((data.unlockRequirements.numOpenPortsRequired as number) - (ns.getServer(data.name).openPortCount as number), 0)
}