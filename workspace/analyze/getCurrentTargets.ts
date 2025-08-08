import {ServerData} from 'workspace/domain/servers/model/ServerData'
import * as Log from 'workspace/frameworks/logging';
import { getNextTarget } from 'workspace/hacking/unlock/unlock.selector'
import {getPortPrograms} from 'workspace/hacking/model/PortProgram'
import { ServersService } from 'workspace/servers/servers.service';
import { ServersRepository } from 'workspace/domain/servers/servers.repository';

export async function main(ns: NS) {
    ns.ui.setTailTitle('Unlock targets');
    ns.ui.openTail();

    // load target files
    let targets: ServerData[] = ServersService.getAllLocked(ns)
        // load host data
        .map(target => ServersRepository.get(ns, target) as ServerData)
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
    ns.print(Log.INFO('Nombre de cible', targets.length));
    ns.print(Log.INFO('Nombre de port opener', getPortPrograms(ns)
        .filter(x => ns.fileExists(x.filename)).length));
    ns.print(Log.INFO('Hacking skill', ns.getPlayer().skills.hacking));
    ns.print(Log.INFO('Next target', getNextTarget(ns)?.name));
	ns.print(Log.getEndLog());
}

function getRemaning(ns: NS, data: ServerData) {
    return Math.max((data.unlockRequirements.numOpenPortsRequired as number) - (ns.getServer(data.name).openPortCount as number), 0)
}