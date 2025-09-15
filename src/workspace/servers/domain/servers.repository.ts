import * as Referentiel from 'workspace/common/referentiel'
import {ServerData} from 'workspace/servers/domain/model/ServerData'
import { ServerType } from "workspace/servers/domain/model/ServerType";
import { UnlockRequirements } from "workspace/servers/domain/model/UnlockRequirements";
import { HackData } from "workspace/servers/domain/model/HackData";
import { DirectoryRepository } from 'workspace/socle/interface/directory-repository';

const REPOSITORY = Referentiel.SERVERS_REPOSITORY;

/**
 * 
 * @remarks RAM cost: 2.3 GB
 */
export class ServersRepository extends DirectoryRepository<ServerData> {
    
    /**
     * 
     * @param ns Bitburner API
     */
    constructor(ns: NS) {
        super(ns, REPOSITORY);
    }

    /**
     * Enregistre en base un nouveau serveur.
     * 
     * @param ns Bitburner API
     * @param hostname serveur qui porte l'execution
     * @param execution nouvelle execution
     * 
     * @remarks Ram cost : 2 GB
     */
    add(hostname: string, parentHost: string = 'UNKNOWN', depth?: number) {
        const server = this.ns.getServer(hostname);
        
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
        this.resetWith(hostname, targetData);
        this.ns.tprint('INFO', ' ', 'New target to scan : ' + hostname);
    }

    /**
     * Enregistre le flag scanned à true d'un serveur.
     * 
     * @param ns Bitburner API
     * @param server serveur à mettre à jour
     * 
     * @remarks Ram cost : 0.1 GB
     */
    setScanned(hostname: string) {
        let serverData: ServerData|null = this.get(hostname);

        if (serverData === null) {
            return;
        }
        
        serverData.state.scanned = true;

        // save data
        this.resetWith(hostname, serverData);
        this.ns.tprint('INFO', ' ', 'New targets to unlock : ' + hostname);
    }

    /**
     * Enregistre le flag unlocked à true d'un serveur.
     * 
     * @param ns Bitburner API
     * @param server serveur à mettre à jour
     * 
     * @remarks Ram cost : 0.1 GB
     */
    setUnlocked(hostname: string) {
        let serverData: ServerData|null = this.get(hostname);

        if (serverData === null) {
            return;
        }
        
        serverData.state.unlocked = true;

        // save data
        this.resetWith(hostname, serverData);
        this.ns.tprint('INFO', ' ', 'New target hackable : ' + hostname);
    }

    /**
     * Rafraichit les données du serveur enregistré en base.
     * 
     * @param ns Bitburner API
     * @param server serveur à mettre à jour
     * 
     * @remarks Ram cost : 2.1 GB
     */
    refresh(hostname: string) {
        const server = this.ns.getServer(hostname);
        let serverData = this.get(hostname);
        
        serverData.unlockRequirements.numOpenPortsRequired = server.numOpenPortsRequired;
        serverData.unlockRequirements.requiredHackingSkill = server.requiredHackingSkill;

        serverData.hackData.minDifficulty = server.minDifficulty;
        serverData.hackData.moneyMax = server.moneyMax;
        serverData.hackData.maxRam = server.maxRam;
        serverData.hackData.cpuCores = server.cpuCores;

        serverData.name = hostname;
        serverData.type = hostname === 'home' ? ServerType.MAIN : server.purchasedByPlayer ? ServerType.BOUGHT : ServerType.EXTERNAL,
        serverData.state.unlocked = server.hasAdminRights;
        
        this.resetWith(serverData.name, serverData);
    }

    /**
     * Remise à zéro de la base de données.
     * 
     * @param ns Bitburner API
     * 
     * @remarks Ram cost : 2.2 GB
     */
    reset() {
        const knownServers: string[] = this.getAllIds();
        for (const server of knownServers) {
            this.ns.mv('home', `${REPOSITORY}/${server}.json`, `${REPOSITORY}/${DirectoryRepository.ARCHIVE_DIRECTORY}/${server}.json`)
        }
        this.add('home', null);
    }
}