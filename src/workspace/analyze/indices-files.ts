import * as Log from 'workspace/frameworks/logging';
import { ServersService } from 'workspace/servers/servers.service';

export async function main(ns: NS) {
    const servers = ServersService.getAllHackable(ns);
    ns.tprint(Log.getStartLog())
    for (const server of servers) {
        const indices = ns.ls(server)
            .filter(x => !x.startsWith('repositories') && !x.startsWith('workspace') && !x.endsWith('.cct'));
        if (indices.length > 0) {
            ns.tprint(Log.color(server, Log.Color.CYAN))
            indices.forEach(x => ns.tprint(x));
            ns.scp(indices, 'home', server);
            ns.tprint('\n')
        }
    }
    ns.tprint(Log.getEndLog())
}