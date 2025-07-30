import * as Referentiel from 'workspace/referentiel'
import * as OwnedServersRepository from 'workspace/domain/owned-servers.repository';
import * as TargetsRepository from 'workspace/domain/targets/targets.repository';
import * as ExecutionsRepository from 'workspace/domain/executions.repository'
import * as Log from 'workspace/logging-framework/main'
import {Money as MoneyPiggyBank} from 'workspace/piggy-bank/application-properties'
import {PORT} from 'workspace/hacking/unlock/unlock.handler';

/**
 * Script à lancer après un reset du jeu (installation d'augmentation).
 */
export async function main(ns: NS) {
    MoneyPiggyBank.setReserveMoney(0);
    
    // TODO : objectif dépend de la vitesse de gain
    /*if (!ns.hasTorRouter()) {
        MoneyPiggyBank.setReserveMoney(200 * 1000);
    }*/

    ns.clearPort(PORT);
    // reset des bases de données
    OwnedServersRepository.reset(ns);
    TargetsRepository.reset(ns);
    ExecutionsRepository.reset(ns);

    // lancement du hacking automatisé
    ns.run(Referentiel.HACKING_DIRECTORY + '/infection/auto-infection.launcher.ts', 1);

    // TODO : lancement du gestionnaire d'embauche

    // lancement de l'achat de node automatisé
    ns.run(Referentiel.HACKNET_DIRECTORY + '/upgrade-hacknet.scheduler.ts', 1, true);

    // TODO : affichage de la TODO list + informations diverses
    ns.tprint(Log.getStartLog());
    ns.tprint(Log.color('TODO', Log.Color.MAGENTA));
    ns.tprint(Log.color('==========', Log.Color.GREEN));
    ns.tprint('Go get a job');
    ns.tprint('Run alias');
    ns.tprint('Go to City > [alpha ent.]; Purchase TOR router; cmd : buy -l')
    ns.tprint(Log.getEndLog());
}
