import { ServersRepository } from 'workspace/servers/domain/servers.repository'
import {ServerData} from 'workspace/servers/domain/model/ServerData'
import { ServerType } from "workspace/servers/domain/model/ServerType";

export class ServersService {
    private ns: NS;
    private repository: ServersRepository;

    /**
     * 
     * @param ns Bitburner API
     */
    constructor(ns: NS) {
        this.ns = ns;
        this.repository = new ServersRepository(ns);
    }
    
    /**
     * Retrouve le chemin de serveur pour atteindre un serveur.
     * @param hostname serveur cible
     * @returns 
     */
    private getHostPath(hostname: string): string[] {
        const data: ServerData|null = this.repository.get(hostname);
        if (!data?.parent) {
            return [hostname];
        }

        return [...this.getHostPath(data.parent), hostname];
    }

    getHostPathLibelle(hostname: string): string {
        return this.getHostPath(hostname).map(x => {
            const data: ServerData|null = this.repository.get(x);
            const unlocked: string = data?.state.unlocked ? 'unlocked' : 'locked';

            return '/' + x + `[${unlocked}]`
        }).reduce((a, b) => a + b);
    }

    /**
     * Construit la commande à executer dans le terminal pour se connecter au serveur cible.
     * @param hostname serveur cible
     * @returns 
     */
    getConnectCommand(hostname: string): string {
        return this.getHostPath(hostname).map(x => {
            return `connect ${x};`
        }).reduce((a, b) => a + ' ' + b);
    }

    getAllUnscanned(): string[] {
        return Array.from(new Set(this.repository.getAllIds()
                .map(x => this.repository.get(x))
                .filter(x => x !== null)
                .filter(x => !x.state.scanned)
                .map(x => x?.name ?? '')))
    }

    getAllLocked(): string[] {
        return this.repository.getAllIds()
                .map(x => this.repository.get(x))
                .filter(x => x !== null)
                .filter(x => !x.state.unlocked && x.type === ServerType.EXTERNAL)
                .map(x => x.name)
    }
    
    getAllUnlocked(): string[] {
        return this.repository.getAllIds()
                .map(x => this.repository.get(x))
                .filter(x => x?.state.unlocked)
                .map(x => x?.name ?? '')
    }
    
    getAllHackable(): string[] {
        return this.getAllExecutable()
            .filter(x => this.repository.get(x)?.type === ServerType.EXTERNAL);
    }

    getAllExecutable(): string[] {
        return this.getAllUnlocked();
    }

    getOwned(): string[] {
        return this.repository.getAllIds()
            .map(x => this.repository.get(x))
            .filter(x => x?.type === ServerType.BOUGHT)
            .map(x => x?.name ?? '');
    }

    getAllUpgradable(): ServerData[] {
        return this.getOwned()
            .map(x => this.repository.get(x))
            .filter(x => x !== null)
            .filter(x => x.hackData.maxRam < this.ns.getPurchasedServerMaxRam());
    }
}