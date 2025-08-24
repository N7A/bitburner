import { ServersRepository } from 'workspace/servers/domain/servers.repository'

export async function main(ns: NS) {
    const serversRepository = new ServersRepository(ns);

    serversRepository.getAllIds().forEach(x => serversRepository.refresh(x));
}