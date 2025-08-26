import * as Referentiel from 'workspace/referentiel'
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'
import { ServersService } from 'workspace/servers/servers.service';

/**
 * Script à lancer après un reset du jeu (installation d'augmentation).
 */
export async function main(ns: NS) {
    const fridayMep = new FridayMep(ns);

    fridayMep.run();
}

class FridayMep {
    //#region Constants
    readonly INFECTION_SCRIPT = Referentiel.CMD_HACKING_DIRECTORY + '/infection/auto-infection.launcher.ts';
    readonly HACKNET_SCRIPT = Referentiel.HACKNET_DIRECTORY + '/upgrade-hacknet.scheduler.ts';
    readonly EXECUTION_SCRIPT = 'cmd/load-balancer/execution.scheduler.ts';
    //#endregion Constants

    private ns: NS;
    private serversService: ServersService;
    private executionsRepository: ExecutionsRepository;

    constructor(ns: NS) {
        this.ns = ns;
        this.serversService = new ServersService(ns);
        this.executionsRepository = new ExecutionsRepository(ns);
    }

    run() {
        // kill all scripts
        this.serversService.getAllExecutable().forEach(x => this.ns.killall(x))
        
        this.resetRepositories();

        this.startScripts();
    }

    private resetRepositories() {
        // reset des bases de données
        this.executionsRepository.reset();
    }

    private startScripts() {
        // lancement du unlock automatisé
        this.ns.run(this.INFECTION_SCRIPT);

        // TODO : lancement du gestionnaire d'embauche

        // lancement de l'achat de node automatisé
        this.ns.run(this.HACKNET_SCRIPT, 1, true);
        
        // lancement du hacking automatisé
        this.ns.run(this.EXECUTION_SCRIPT, 1, true);
    }
}