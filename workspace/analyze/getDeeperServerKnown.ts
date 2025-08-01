import * as ServersRepository from 'workspace/domain/servers/servers.repository';
import {ServerData} from 'workspace/domain/servers/model/ServerData'
import * as Log from 'workspace/frameworks/logging';

export async function main(ns: NS) {
    const servers = ServersRepository.getAll(ns);
    let sortedServers: ServerData[] = servers.map(x => ServersRepository.get(ns, x) as ServerData)
    .sort((a, b) => {
        return (a.depth ?? 0) - (b.depth ?? 0)
    });

    for (const server of sortedServers) {
        ns.tprint(Log.color(server.name, Log.Color.CYAN));
        ns.tprint(Log.INFO('Profondeur', server.depth));
        ns.tprint(Log.INFO('Parent', server.parent));
    }
}