import * as Referentiel from 'workspace/referentiel'
import * as OwnedServersRepository from 'workspace/domain/owned-servers.repository';
import * as TargetsRepository from 'workspace/domain/targets/targets.repository';
import {OwnedServer} from 'workspace/load-balancer/model/OwnedServer'

//#region Constants
export const INFECTION_SCRIPT = Referentiel.HACKING_DIRECTORY + '/infection/auto-infection.launcher.ts';
export const HACKNET_SCRIPT = Referentiel.HACKNET_DIRECTORY + '/upgrade-hacknet.scheduler.ts';
//#endregion Constants

/**
 * Script à lancer après un reset du jeu (installation d'augmentation).
 */
export async function main(ns: NS) {
    // kill all scripts
    (OwnedServersRepository.getAll(ns) as OwnedServer[]).forEach(x => ns.killall(x.hostname))

    // reset des bases de données
    TargetsRepository.reset(ns);

    // lancement du hacking automatisé
    ns.run(INFECTION_SCRIPT);

    // TODO : lancement du gestionnaire d'embauche

    // lancement de l'achat de node automatisé
    ns.run(HACKNET_SCRIPT, 1, true);
}
