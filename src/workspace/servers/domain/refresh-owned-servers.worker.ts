import { ServersRepository } from 'workspace/servers/domain/servers.repository'

export async function main(ns: NS) {
    ServersRepository.add(ns, 'home', null);
    ns.getPurchasedServers().forEach(x => {
        ServersRepository.add(ns, x, 'home');
    });
}