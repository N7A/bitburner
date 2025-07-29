import * as ServersRepository from 'workspace/domain/servers/servers.repository'

export async function main(ns: NS) {
    //#region paramètres d'entrée
    const targetHost: string = ns.args.length >= 1 ? ns.args[0] as string : ns.getHostname();
    const parentHost: string = ns.args.length >= 2 ? ns.args[1] as string : 'UNKNOWN';
    const depth: number|undefined = ns.args.length >= 3 ? ns.args[2] as number : undefined;
    //#endregion
    
    ServersRepository.add(ns, targetHost, parentHost, depth);
}