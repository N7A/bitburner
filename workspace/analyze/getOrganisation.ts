import * as ServersRepository from 'workspace/domain/servers/servers.repository';
import * as Log from 'workspace/logging-framework/main';

export async function main(ns: NS) {
    const servers = ServersRepository.getAll(ns);

    for (const server of servers) {
        const mappedServer = ns.getServer(server);
        ns.tprint(Log.color(server, Log.Color.CYAN));
        ns.tprint(Log.INFO('Organisation', mappedServer.organizationName));
    }
}