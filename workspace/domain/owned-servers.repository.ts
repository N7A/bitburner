import * as Referentiel from 'workspace/referentiel'
import {OwnedServer} from 'workspace/load-balancer/model/OwnedServer'

const REPOSITORY = Referentiel.OWNED_SERVERS_REPOSITORY_FILE;

/**
 * Récupère les serveurs enregistrés en base de donnée.
 * 
 * @param ns Bitburner API
 */
export function getAll(ns: NS) {
    return JSON.parse(ns.read(REPOSITORY)) as OwnedServer[];
}

/**
 * Enregistre en base un nouveau serveur.
 * 
 * @param ns Bitburner API
 * @param server nouveau serveur
 */
export function add(ns: NS, server: OwnedServer) {
    // get last version
    let ownedServers: OwnedServer[] = getAll(ns);

    // add to owned servers
    ownedServers.push(server);
    
    // save data
    resetWith(ns, ownedServers);
}

/**
 * Enregistre en base la mise à jour d'un serveur.
 * 
 * @param ns Bitburner API
 * @param server serveur à mettre à jour
 */
export function save(ns: NS, server: OwnedServer) {
    // get last version
    let ownedServers: OwnedServer[] = getAll(ns);

    // remove all version
    ownedServers = ownedServers.filter(server => server.hostname !== server.hostname);

    // save data
    resetWith(ns, ownedServers);
    
    // add to owned servers
    add(ns, server);
}

/**
 * Remise à zéro de la base de donnée.
 * 
 * @param ns Bitburner API
 */
export function reset(ns: NS) {
    let ownedServers: OwnedServer[] = [
        {hostname: 'home'} as OwnedServer, 
        ...ns.getPurchasedServers().map((hostname: string) => ({hostname: hostname, ram: ns.getServerMaxRam(hostname)} as OwnedServer))
    ];

    // save data
    resetWith(ns, ownedServers);
}

/**
 * Remet à zéro la base de donnée avec les serveurs fournis en entrée.
 * 
 * @param ns Bitburner API
 * @param ownedServers serveurs à sauvegarder
 */
function resetWith(ns: NS, ownedServers: OwnedServer[]) {
    ns.write(REPOSITORY, JSON.stringify(ownedServers, null, 4), "w");
}
