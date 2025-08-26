import * as Log from 'workspace/frameworks/logging';
import { ServersService } from 'workspace/servers/servers.service';

export async function main(ns: NS) {
    const serversService = new ServersService(ns);
    const servers = serversService.getAllHackable();
    ns.tprint(Log.getStartLog())
    for (const server of servers) {
        const indices = ns.ls(server)
            .filter(x => !x.startsWith('repositories') 
                && !x.startsWith('workspace') 
                && !x.startsWith('cmd') 
                && !x.endsWith('.cct'));
        if (indices.length > 0) {
            ns.tprint(Log.title(server))
            indices.forEach(x => ns.tprint(x));
            ns.scp(indices, 'home', server);
            ns.tprint('\n')
        }
    }
    ns.tprint(Log.getEndLog())
}