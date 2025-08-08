import * as Log from 'workspace/frameworks/logging';
import { ServersRepository } from 'workspace/domain/servers/servers.repository';

export async function main(ns: NS) {
    setupDashboard(ns);
    const servers = ServersRepository.getAll(ns);
    ns.print(Log.getStartLog())
    for (const server of servers) {
        const contracts = ns.ls(server).filter(x => x.endsWith('.cct'));
        if (contracts.length > 0) {
            ns.tprint(Log.color(server, Log.Color.CYAN))
            contracts.forEach(x => ns.tprint(x))
            ns.tprint('\n')
        }
    }
    ns.print(Log.getEndLog())
}

//#region Dashboard
function setupDashboard(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();
    
    Log.initTailTitle(ns, 'Contracts', 'info');
    
    ns.ui.openTail();
}
//#endregion Dashboard
