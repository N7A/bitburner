import { ServersRepository } from 'workspace/servers/domain/servers.repository'

export async function main(ns: NS) {
    const serversRepository = new ServersRepository(ns);
    serversRepository.add('home', null);
    ns.getPurchasedServers().forEach(x => {
        serversRepository.add(x, 'home');
    });
}