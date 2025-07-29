import * as ServersRepository from 'workspace/domain/servers/servers.repository'

export async function main(ns: NS) {
    ServersRepository.refresh(ns);
}