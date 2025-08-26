import * as Referentiel from 'workspace/referentiel'
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'
import { ServersService } from 'workspace/servers/servers.service';

//#region Constants
export const INFECTION_SCRIPT = Referentiel.CMD_HACKING_DIRECTORY + '/infection/auto-infection.launcher.ts';
export const HACKNET_SCRIPT = Referentiel.HACKNET_DIRECTORY + '/upgrade-hacknet.scheduler.ts';
//#endregion Constants

/**
 * Script à lancer après un reset du jeu (installation d'augmentation).
 */
export async function main(ns: NS) {
    const serversService = new ServersService(ns);
    const executionsRepository = new ExecutionsRepository(ns);

    // kill all scripts
    serversService.getAllExecutable().forEach(x => ns.killall(x))

    // reset des bases de données
    executionsRepository.reset();

    // lancement du hacking automatisé
    ns.run(INFECTION_SCRIPT);

    // TODO : lancement du gestionnaire d'embauche

    // lancement de l'achat de node automatisé
    ns.run(HACKNET_SCRIPT, 1, true);
}
