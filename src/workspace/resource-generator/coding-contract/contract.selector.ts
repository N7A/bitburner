import {Contract} from 'workspace/resource-generator/coding-contract/model/Contract';
import { ServersRepository } from 'workspace/servers/domain/servers.repository';

export async function main(ns: NS): Promise<Contract[]> {
    const knownServers = ServersRepository.getAll(ns);

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
