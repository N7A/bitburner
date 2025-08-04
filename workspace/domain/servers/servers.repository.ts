import * as Referentiel from 'workspace/referentiel'
import {ServerData, UnlockRequirements, HackData} from 'workspace/domain/servers/model/ServerData'
import {get as TargetsRepositoryGet} from 'workspace/domain/targets/targets.repository';
import { Targets } from 'workspace/domain/targets/model/Targets';

const REPOSITORY = Referentiel.SERVERS_REPOSITORY;

/**
 * Récupère les executions enregistrées en base de données.
 * 
 * @param ns Bitburner API
 */
export function getAll(ns: NS): string[] {
    return ns.ls('home', REPOSITORY)
        .filter(x => x.startsWith(REPOSITORY))
        .map(x => x.substring(x.lastIndexOf('/')+1, x.lastIndexOf('.json')));
}

/**
 * Récupère les executions enregistrées en base de données.
 * 
 * @param ns Bitburner API
 */
export function get(ns: NS, hostname: string): ServerData|null {
    if (!ns.fileExists(REPOSITORY + '/' + hostname + '.json', 'home')) {
        return null;
    }
    return JSON.parse(ns.read(REPOSITORY + '/' + hostname + '.json'));
}

/**
 * Enregistre en base une nouvelle execution.
 * 
 * @param ns Bitburner API
 * @param hostname serveur qui porte l'execution
 * @param execution nouvelle execution
 */
export function add(ns: NS, hostname: string, parentHost: string = 'UNKNOWN', depth?: number, unlocked?: boolean) {
    const server = ns.getServer(hostname);
    
    const unlockRequirements: UnlockRequirements = {
        numOpenPortsRequired: server.numOpenPortsRequired,
        requiredHackingSkill: server.requiredHackingSkill
    }
    const hackData: HackData = {
        minDifficulty: server.minDifficulty,
        moneyMax: server.moneyMax,
        maxRam: server.maxRam,
        cpuCores: server.cpuCores
    }

    const targetData: ServerData = {
        name: hostname,
        parent: parentHost,
        depth: depth,
        unlockRequirements: unlockRequirements,
        hackData: hackData,
        state: {
            unlocked: unlocked
        }
    };
    
    // save data
    resetWith(ns, hostname, targetData);
}

/**
 * Enregistre en base la mise à jour d'un serveur.
 * 
 * @param ns Bitburner API
 * @param server serveur à mettre à jour
 */
export function handleUnlock(ns: NS, hostname: string) {
    let serverData: ServerData|null = get(ns, hostname);

    if (serverData === null) {
        return;
    }
    
    serverData.state.unlocked = true;

    // save data
    resetWith(ns, hostname, serverData);
}

/**
 * Enregistre en base la mise à jour d'un serveur.
 * 
 * @param ns Bitburner API
 * @param server serveur à mettre à jour
 */
export function save(ns: NS, serverData: ServerData) {
    // save data
    resetWith(ns, serverData.name, serverData);
}

export function refresh(ns: NS) {
    const serversFile: string[] = ns.ls('home', REPOSITORY)
    const knownServers = serversFile.map(file => (JSON.parse(ns.read(file)) as ServerData).name)
    for (const server of knownServers) {
        add(ns, server)
    }
}

/**
 * Remet à zéro la base de données avec les serveurs fournis en entrée.
 * 
 * @param ns Bitburner API
 * @param hostname serveur qui porte l'execution
 * @param executions executions à sauvegarder
 */
function resetWith(ns: NS, hostname: string, data: ServerData) {
    // TODO : {parentTargetHost}/{targetHost}.json
    ns.write(REPOSITORY + '/' + hostname + '.json', JSON.stringify(data, null, 4), "w");
}

export function getHostPath(ns: NS, hostname: string): string[] {
    const data: ServerData|null = get(ns, hostname);
    if (!data?.parent) {
        return [hostname];
    }

    return [...getHostPath(ns, data.parent), hostname];
}

export function getHostPathLibelle(ns: NS, hostname: string): string {
    const targets: Targets = TargetsRepositoryGet(ns);

    return getHostPath(ns, hostname).map(x => {
        const unlocked: string = !targets.unlockTargets.includes(x) ? 'unlocked' : 'locked';

        return '/' + hostname + `[${unlocked}]`
    }).reduce((a, b) => a + b);
}

export function getConnectCommand(ns: NS, hostname: string): string {
    return getHostPath(ns, hostname).map(x => {
        return `connect ${hostname};`
    }).reduce((a, b) => a + ' ' + b);
}
