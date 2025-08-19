import * as Referentiel from 'workspace/referentiel'
import * as ExecutionsRepository from 'workspace/load-balancer/domain/executions.repository'
import { ServersService } from 'workspace/servers/servers.service';

//#region Constants
export const INFECTION_SCRIPT = Referentiel.HACKING_DIRECTORY + '/infection/auto-infection.launcher.ts';
export const HACKNET_SCRIPT = Referentiel.HACKNET_DIRECTORY + '/upgrade-hacknet.scheduler.ts';
//#endregion Constants

/**
 * Script à lancer après un reset du jeu (installation d'augmentation).
 */
export async function main(ns: NS) {
    // kill all scripts
    ServersService.getAllExecutable(ns).forEach(x => ns.killall(x))

    // reset des bases de données
    ExecutionsRepository.reset(ns);

    // lancement du hacking automatisé
    ns.run(INFECTION_SCRIPT);

    // TODO : lancement du gestionnaire d'embauche

    // lancement de l'achat de node automatisé
    ns.run(HACKNET_SCRIPT, 1, true);
}
