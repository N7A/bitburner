import * as Referentiel from 'workspace/referentiel'
import {TargetHost} from 'workspace/hacking/model/TargetHost'
import {Targets} from 'workspace/domain/targets/model/Targets'
import * as Log from 'workspace/frameworks/logging';
import {getNextTarget} from 'workspace/hacking/unlock/utils'
import {getPortPrograms} from 'workspace/hacking/model/PortProgram'

export async function main(ns: NS) {
    ns.ui.setTailTitle('Unlock targets');
    ns.ui.openTail();

    // load target files
    let targets: TargetHost[] = Array.from((JSON.parse(ns.read(Referentiel.TARGETS_REPOSITORY_FILE)) as Targets).unlockTargets)
        // load host data
        .map(target => JSON.parse(ns.read(Referentiel.SERVERS_REPOSITORY + `/${target}.json`)) as TargetHost)
        .sort((a, b) => (a.unlockRequirements.requiredHackingSkill as number) - (b.unlockRequirements.requiredHackingSkill as number))
        .reverse();

    // TODO : formater en tableau
	ns.print(Log.getStartLog());
    for (const data of targets) {
        ns.print(Log.color(data.name, Log.Color.CYAN));
        ns.print('    ', Log.INFO('Required open port', getRemaning(ns, data)));
        ns.print('    ', Log.color('Required hacking skill : ', Log.Color.MAGENTA), data.unlockRequirements.requiredHackingSkill);
        ns.print(Log.color('----------', Log.Color.WHITE))
    }
    ns.print(Log.color('Nombre de cible : ', Log.Color.MAGENTA), targets.length);
    ns.print(Log.color('Nombre de port opener : ', Log.Color.MAGENTA), getPortPrograms(ns)
        .filter(x => ns.fileExists(x.filename)).length);
    ns.print(Log.color('Hacking skill : ', Log.Color.MAGENTA), ns.getPlayer().skills.hacking);
    ns.print(Log.INFO('Next target', getNextTarget(ns)?.name));
	ns.print(Log.getEndLog());
}

function getRemaning(ns: NS, data: TargetHost) {
    return Math.max((data.unlockRequirements.numOpenPortsRequired as number) - (ns.getServer(data.name).openPortCount as number), 0)
}