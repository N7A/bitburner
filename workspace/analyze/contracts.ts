import * as Log from 'workspace/frameworks/logging';
import * as ServersRepository from 'workspace/domain/servers/servers.repository';

export async function main(ns: NS) {
    const servers = ServersRepository.getAll(ns);
    ns.tprint(Log.getStartLog())
    for (const server of servers) {
        const contracts = ns.ls(server).filter(x => x.endsWith('.cct'));
        if (contracts.length > 0) {
            ns.tprint(Log.color(server, Log.Color.CYAN))
            contracts.forEach(x => ns.tprint(x))
            ns.tprint('\n')
        }
    }
    ns.tprint(Log.getEndLog())
}