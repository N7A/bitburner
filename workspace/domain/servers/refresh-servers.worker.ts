import { ServersRepository } from 'workspace/domain/servers/servers.repository'

export async function main(ns: NS) {
    ServersRepository.getAll(ns).forEach(x => ServersRepository.refresh(ns, x));
}