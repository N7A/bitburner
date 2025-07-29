import * as ServersRepository from 'workspace/domain/servers/servers.repository';
import {TargetHost} from 'workspace/hacking/model/TargetHost'
import * as Log from 'workspace/logging-framework/main';

export async function main(ns: NS) {
    const servers = ServersRepository.getAll(ns);
    let sortedServers: TargetHost[] = servers.map(x => ServersRepository.get(ns, x) as TargetHost)
    .sort((a, b) => {
        return (a.depth ?? 0) - (b.depth ?? 0)
    });

    for (const server of sortedServers) {
        ns.tprint(Log.color(server.name, Log.Color.CYAN));
        ns.tprint(Log.INFO('Profondeur', server.depth));
        ns.tprint(Log.INFO('Parent', server.parent));
    }
}