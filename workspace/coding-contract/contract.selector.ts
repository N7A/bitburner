import {Contract} from 'workspace/coding-contract/model/Contract';
import {getAll as ServersRepositoryGetAll} from 'workspace/domain/servers/servers.repository';

export async function main(ns: NS): Promise<Contract[]> {
    const knownServers = ServersRepositoryGetAll(ns);

    return getCurrentContracts(ns, knownServers);
}

function getCurrentContracts(ns: NS, hostnames: string[]): Contract[] {
    return hostnames.flatMap(
        // TODO : hostname can inexist
        hostname => ns.ls(hostname)
        .filter(x => x.endsWith('.cct'))
        .map(x => {return {hostname: hostname, filepath: x} as Contract})
    );
}
