import * as Referentiel from 'workspace/referentiel'
import * as OwnedServersRepository from 'workspace/domain/owned-servers.repository';
import * as ExecutionsRepository from 'workspace/domain/executions/executions.repository'
import * as Log from 'workspace/frameworks/logging';
import {Money as MoneyPiggyBank} from 'workspace/piggy-bank/piggy-bank.service'
import { ServersRepository } from 'workspace/domain/servers/servers.repository'

//#region Constants
export const INFECTION_SCRIPT = Referentiel.HACKING_DIRECTORY + '/infection/auto-infection.launcher.ts';
export const HACKNET_SCRIPT = Referentiel.HACKNET_DIRECTORY + '/upgrade-hacknet.scheduler.ts';
//#endregion Constants

/**
 * Script à lancer après un reset du jeu (installation d'augmentation).
 */
export async function main(ns: NS) {
    // reset reserve money
    MoneyPiggyBank.setReserveMoney(ns, 0);
    
    // TODO : objectif dépend de la vitesse de gain
    /*if (!ns.hasTorRouter()) {
        MoneyPiggyBank.setReserveMoney(ns, 200 * 1000);
    }*/

    // reset des bases de données
    OwnedServersRepository.reset(ns);
    ServersRepository.reset(ns);
    ExecutionsRepository.reset(ns);

    // lancement du hacking automatisé
    ns.run(INFECTION_SCRIPT);

    // TODO : lancement du gestionnaire d'embauche

    // lancement de l'achat de node automatisé
    ns.run(HACKNET_SCRIPT, 1, true);

    // affichage de la TODO list et informations diverses
    showTodo(ns);
}

function showTodo(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();
    
    Log.initTailTitle(ns, 'TODO');

    // TODO : compléter
    ns.print(Log.getStartLog());
    ns.print('[ ] Go get a job');
    ns.print('[ ] Run alias');
    ns.print('[ ] Go to City > [alpha ent.]; Purchase TOR router; cmd : buy -l')
    ns.print(Log.getEndLog());

    ns.ui.openTail();
}
