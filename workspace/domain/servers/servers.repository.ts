import * as Referentiel from 'workspace/referentiel'
import {ServerData, UnlockRequirements, HackData, ServerType} from 'workspace/domain/servers/model/ServerData'

const REPOSITORY = Referentiel.SERVERS_REPOSITORY;

export class ServersRepository {
    /**
     * Récupère les executions enregistrées en base de données.
     * 
     * @param ns Bitburner API
     */
    static getAll(ns: NS): string[] {
        return ns.ls('home', REPOSITORY)
            .filter(x => x.startsWith(REPOSITORY))
            .map(x => x.substring(x.lastIndexOf('/')+1, x.lastIndexOf('.json')));
    }

    /**
     * Récupère les executions enregistrées en base de données.
     * 
     * @param ns Bitburner API
     */
    static get(ns: NS, hostname: string): ServerData|null {
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
    static add(ns: NS, hostname: string, type: ServerType, parentHost: string = 'UNKNOWN', depth?: number, unlocked?: boolean) {
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
            type: type,
            parent: parentHost,
            depth: depth,
            unlockRequirements: unlockRequirements,
            hackData: hackData,
            state: {
                unlocked: unlocked
            }
        };
        
        // save data
        ServersRepository.resetWith(ns, hostname, targetData);
    }

    /**
     * Enregistre en base la mise à jour d'un serveur.
     * 
     * @param ns Bitburner API
     * @param server serveur à mettre à jour
     */
    static setScanned(ns: NS, hostname: string) {
        let serverData: ServerData|null = ServersRepository.get(ns, hostname);

        if (serverData === null) {
            return;
        }
        
        serverData.state.scanned = true;

        // save data
        ServersRepository.resetWith(ns, hostname, serverData);
    }

    /**
     * Enregistre en base la mise à jour d'un serveur.
     * 
     * @param ns Bitburner API
     * @param server serveur à mettre à jour
     */
    static setUnlocked(ns: NS, hostname: string) {
        let serverData: ServerData|null = ServersRepository.get(ns, hostname);

        if (serverData === null) {
            return;
        }
        
        serverData.state.unlocked = true;

        // save data
        ServersRepository.resetWith(ns, hostname, serverData);
    }

    /**
     * Enregistre en base la mise à jour d'un serveur.
     * 
     * @param ns Bitburner API
     * @param server serveur à mettre à jour
     */
    static save(ns: NS, serverData: ServerData) {
        // save data
        ServersRepository.resetWith(ns, serverData.name, serverData);
    }

    static refresh(ns: NS) {
        const serversFile: string[] = ServersRepository.getAll(ns)
        const knownServers: ServerData[] = serversFile.map(file => (JSON.parse(ns.read(file)) as ServerData))
        for (const server of knownServers) {
            ServersRepository.add(ns, server.name, server.type);
        }
    }

    static reset(ns: NS) {
        const serversFile: string[] = ServersRepository.getAll(ns)
        const knownServers = serversFile.map(file => (JSON.parse(ns.read(file)) as ServerData).name)
        for (const server of knownServers) {
            ns.mv('home', REPOSITORY + '/' + server + '.json', REPOSITORY + '/archive/' + server + '.json')
        }
        ServersRepository.add(ns, 'home', ServerType.MAIN);
        // TODO :  ...ns.getPurchasedServers()
    }

    /**
     * Remet à zéro la base de données avec les serveurs fournis en entrée.
     * 
     * @param ns Bitburner API
     * @param hostname serveur qui porte l'execution
     * @param executions executions à sauvegarder
     */
    private static resetWith(ns: NS, hostname: string, data: ServerData) {
        ns.write(REPOSITORY + '/' + hostname + '.json', JSON.stringify(data, null, 4), "w");
    }
}