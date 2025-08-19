import { ServersRepository } from 'workspace/servers/domain/servers.repository'

export async function main(ns: NS) {
    ServersRepository.getAll(ns).forEach(x => ServersRepository.refresh(ns, x));
}