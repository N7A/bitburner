import { ServersRepository } from 'workspace/servers/domain/servers.repository'
import {ServerData} from 'workspace/servers/domain/model/ServerData'
import { ServerType } from "workspace/servers/domain/model/ServerType";
import { APPAREIL_LOGO, PERSONNALITE_LOGO, SERVER_NAMES } from 'workspace/servers/application.properties';
import * as Log from 'workspace/socle/utils/logging';

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
    
    getNextServerName() {
        const hostnames = SERVER_NAMES;
        const boughtServers: string[] = this.getOwned();
        const availableHostnames: string[] = hostnames
            .filter(x => boughtServers.every(y => !y.startsWith(x)));
        let nextHostname: string = `Serveur ${boughtServers.length}`;
        if (availableHostnames.length > 0) {
            nextHostname = availableHostnames.shift();
        }

        const availableAppareils = APPAREIL_LOGO;
        const appareilMax = availableAppareils.length -1;
        const appareilMin = 0;
        const appareilIndex = Math.round(Math.random() * (appareilMax - appareilMin) + appareilMin);

        const availablePersonnalites = PERSONNALITE_LOGO;
        const personnaliteMax = availablePersonnalites.length -1;
        const personnaliteMin = 0;
        const personnaliteIndex = Math.round(Math.random() * (personnaliteMax - personnaliteMin) + personnaliteMin);

        return `${nextHostname}•${availableAppareils[appareilIndex]}${availablePersonnalites[personnaliteIndex]}`;
    }

    /**
     * Retrouve le chemin de serveur pour atteindre un serveur.
     * @param hostname serveur cible
     * @returns 
     */
    getHostPath(hostname: string): string[] {
        const data: ServerData|null = this.repository.get(hostname);
        if (!data?.parent) {
            return [hostname];
        }

        return [...this.getHostPath(data.parent), hostname];
    }

    isHostConnectionPossible(hostname: string): boolean {
        return this.getHostPath(hostname).every(x => {
            const data: ServerData|null = this.repository.get(x);
            return data?.state.unlocked;
        });
    }

    getHostPathLibelle(hostname: string): string {
        return this.getHostPath(hostname).map(x => {
            const data: ServerData|null = this.repository.get(x);
            const unlocked: string = data?.state.unlocked ? 'unlocked' : 'locked';

            return '/' + x + `[${Log.color(unlocked, data?.state.unlocked ? Log.Color.GREEN : Log.Color.RED)}]`;
        }).join('\n');
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
        return Array.from(new Set(this.repository.getAll()
                .filter(x => !x.state.scanned)
                .map(x => x?.name ?? '')))
    }

    getAllLocked(): string[] {
        return this.repository.getAll()
                .filter(x => x !== null)
                .filter(x => !x.state.unlocked && x.type === ServerType.EXTERNAL)
                .map(x => x.name)
    }
    
    getAllUnlocked(): string[] {
        return this.repository.getAll()
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
        return this.repository.getAll()
            .filter(x => x?.type === ServerType.BOUGHT)
            .map(x => x?.name ?? '');
    }

    getAllUpgradable(): ServerData[] {
        return this.getOwned()
            .map(x => this.repository.get(x))
            .filter(x => x !== null)
            .filter(x => x.hackData.maxRam < this.ns.getPurchasedServerMaxRam());
    }

    refreshAll(): void {
        this.repository.getAllIds()
            .forEach(x => this.repository.refresh(x));
    }
}