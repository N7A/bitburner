import { ServersRepository } from 'workspace/servers/domain/servers.repository';
import {ServerData} from 'workspace/servers/domain/model/ServerData'
import * as Log from 'workspace/socle/logging';

export async function main(ns: NS) {
    const serversRepository = new ServersRepository(ns);
    let sortedServers: ServerData[] = serversRepository.getAll()
        .sort((a, b) => {
            return (a.depth ?? 0) - (b.depth ?? 0)
        });

    for (const server of sortedServers) {
        ns.tprint(Log.color(server.name, Log.Color.CYAN));
        ns.tprint(Log.INFO('Profondeur', server.depth));
        ns.tprint(Log.INFO('Parent', server.parent));
    }
}