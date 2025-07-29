import {Contract} from 'workspace/coding-contract/model/Contract';
import {getAll as ServersRepositoryGetAll} from 'workspace/domain/servers/servers.repository';
import * as Log from 'workspace/logging-framework/main';

export async function main(ns: NS): Promise<Contract[]> {
    const knownServers = ServersRepositoryGetAll(ns);

    return getCurrentContracts(ns, knownServers);
}

function getCurrentContracts(ns: NS, hostnames: string[]): Contract[] {
    return hostnames.flatMap(
        hostname => ns.ls(hostname)
        .filter(x => x.endsWith('.cct'))
        .map(x => {return {hostname: hostname, filepath: x} as Contract})
    );
}
