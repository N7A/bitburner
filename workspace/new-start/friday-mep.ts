import * as Referentiel from 'workspace/referentiel'
import * as OwnedServersRepository from 'workspace/domain/owned-servers.repository';
import * as TargetsRepository from 'workspace/domain/targets/targets.repository';
import {OwnedServer} from 'workspace/load-balancer/model/OwnedServer'
import {PORT} from 'workspace/hacking/unlock/unlock.handler';

/**
 * Script à lancer après un reset du jeu (installation d'augmentation).
 */
export async function main(ns: NS) {
    (OwnedServersRepository.getAll(ns) as OwnedServer[]).forEach(x => ns.killall(x.hostname))

    ns.clearPort(PORT);
    // reset des bases de données
    TargetsRepository.reset(ns);

    // lancement du hacking automatisé
    ns.run(Referentiel.HACKING_DIRECTORY + '/infection/auto-infection.launcher.ts', 1);

    // TODO : lancement du gestionnaire d'embauche

    // lancement de l'achat de node automatisé
    ns.run(Referentiel.HACKNET_DIRECTORY + '/upgrade-hacknet.scheduler.ts', 1, true);
}
