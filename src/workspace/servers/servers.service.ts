import { ServersRepository } from 'workspace/servers/domain/servers.repository'
import {ServerData, ServerType} from 'workspace/servers/domain/model/ServerData'

export class ServersService {
    
    /**
     * Retrouve le chemin de serveur pour atteindre un serveur.
     * @param ns Bitburner API
     * @param hostname serveur cible
     * @returns 
     */
    private static getHostPath(ns: NS, hostname: string): string[] {
        const data: ServerData|null = ServersRepository.get(ns, hostname);
        if (!data?.parent) {
            return [hostname];
        }

        return [...ServersService.getHostPath(ns, data.parent), hostname];
    }

    static getHostPathLibelle(ns: NS, hostname: string): string {
        return ServersService.getHostPath(ns, hostname).map(x => {
            const data: ServerData|null = ServersRepository.get(ns, x);
            const unlocked: string = data?.state.unlocked ? 'unlocked' : 'locked';

            return '/' + x + `[${unlocked}]`
        }).reduce((a, b) => a + b);
    }

    /**
     * Construit la commande à executer dans le terminal pour se connecter au serveur cible.
     * @param ns Bitburner API
     * @param hostname serveur cible
     * @returns 
     */
    static getConnectCommand(ns: NS, hostname: string): string {
        return ServersService.getHostPath(ns, hostname).map(x => {
            return `connect ${x};`
        }).reduce((a, b) => a + ' ' + b);
    }

    static getAllUnscanned(ns: NS): string[] {
        return Array.from(new Set(ServersRepository.getAll(ns)
                .map(x => ServersRepository.get(ns, x))
                .filter(x => x !== null)
                .filter(x => !x.state.scanned)
                .map(x => x?.name ?? '')))
    }

    static getAllLocked(ns: NS): string[] {
        return ServersRepository.getAll(ns)
                .map(x => ServersRepository.get(ns, x))
                .filter(x => x !== null)
                .filter(x => !x.state.unlocked && x.type === ServerType.EXTERNAL)
                .map(x => x.name)
    }
    
    static getAllUnlocked(ns: NS): string[] {
        return ServersRepository.getAll(ns)
                .map(x => ServersRepository.get(ns, x))
                .filter(x => x?.state.unlocked)
                .map(x => x?.name ?? '')
    }
    
    static getAllHackable(ns: NS): string[] {
        return ServersService.getAllExecutable(ns)
            .filter(x => ServersRepository.get(ns, x)?.type === ServerType.EXTERNAL);
    }

    static getAllExecutable(ns: NS): string[] {
        return ServersService.getAllUnlocked(ns);
    }

    static getOwned(ns: NS): string[] {
        return ServersRepository.getAll(ns)
            .map(x => ServersRepository.get(ns, x))
            .filter(x => x?.type === ServerType.BOUGHT)
            .map(x => x?.name ?? '');
    }

    static getAllUpgradable(ns: NS): ServerData[] {
        return ServersService.getOwned(ns)
            .map(x => ServersRepository.get(ns, x))
            .filter(x => x !== null)
            .filter(x => x.hackData.maxRam < ns.getPurchasedServerMaxRam());
    }
}