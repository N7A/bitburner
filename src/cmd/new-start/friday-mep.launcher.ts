import * as Referentiel from 'workspace/common/referentiel'
import { ExecutionOrdersService } from 'workspace/load-balancer/execution-orders.service';
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
    private executionOrdersService: ExecutionOrdersService;

    constructor(ns: NS) {
        this.ns = ns;
        this.serversService = new ServersService(ns);
        this.executionOrdersService = new ExecutionOrdersService(ns);
    }

    run() {
        // kill all scripts
        this.serversService.getAllExecutable().forEach(x => this.ns.killall(x))
        
        this.resetRepositories();

        this.startScripts();
    }

    private resetRepositories() {
        // reset des bases de données
        this.executionOrdersService.reset();
    }

    private startScripts() {
        // lancement du unlock automatisé
        this.ns.run(this.INFECTION_SCRIPT, {preventDuplicates: true});

        // TODO : lancement du gestionnaire d'embauche

        // lancement de l'achat de node automatisé
        this.ns.run(this.HACKNET_SCRIPT, {preventDuplicates: true}, true);
        
        // lancement du hacking automatisé
        this.ns.run(this.EXECUTION_SCRIPT, {preventDuplicates: true});
    }
}