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
    static add(ns: NS, hostname: string, parentHost: string = 'UNKNOWN', depth?: number) {
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
            type: hostname === 'home' ? ServerType.MAIN : server.purchasedByPlayer ? ServerType.BOUGHT : ServerType.EXTERNAL,
            parent: parentHost,
            depth: depth,
            unlockRequirements: unlockRequirements,
            hackData: hackData,
            state: {
                unlocked: server.hasAdminRights
            }
        };
        
        // save data
        ServersRepository.resetWith(ns, hostname, targetData);
        ns.tprint('INFO', ' ', 'New target to scan : ' + hostname);
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
        ns.tprint('INFO', ' ', 'New targets to unlock : ' + hostname);
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
        ns.tprint('INFO', ' ', 'New target hackable : ' + hostname);
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

    static refresh(ns: NS, hostname: string) {
        const server = ns.getServer(hostname);
        let serverData = ServersRepository.get(ns, hostname);
        
        serverData.unlockRequirements.numOpenPortsRequired = server.numOpenPortsRequired;
        serverData.unlockRequirements.requiredHackingSkill = server.requiredHackingSkill;

        serverData.hackData.minDifficulty = server.minDifficulty;
        serverData.hackData.moneyMax = server.moneyMax;
        serverData.hackData.maxRam = server.maxRam;
        serverData.hackData.cpuCores = server.cpuCores;

        serverData.name = hostname;
        serverData.type = hostname === 'home' ? ServerType.MAIN : server.purchasedByPlayer ? ServerType.BOUGHT : ServerType.EXTERNAL,
        serverData.state.unlocked = server.hasAdminRights;
        
        ServersRepository.resetWith(ns, serverData.name, serverData);
    }

    static reset(ns: NS) {
        const knownServers: string[] = ServersRepository.getAll(ns);
        for (const server of knownServers) {
            ns.mv('home', REPOSITORY + '/' + server + '.json', REPOSITORY + '/archive/' + server + '.json')
        }
        ServersRepository.add(ns, 'home');
        ns.getPurchasedServers().forEach(x => {
            ServersRepository.add(ns, x);
        })
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