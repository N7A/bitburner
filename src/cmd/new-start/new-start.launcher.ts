import * as Referentiel from 'workspace/referentiel'
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'
import * as Log from 'workspace/frameworks/logging';
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service'
import { ServersRepository } from 'workspace/servers/domain/servers.repository'

//#region Constants
export const INFECTION_SCRIPT = Referentiel.CMD_HACKING_DIRECTORY + '/infection/auto-infection.launcher.ts';
export const HACKNET_SCRIPT = Referentiel.HACKNET_DIRECTORY + '/upgrade-hacknet.scheduler.ts';
export const EXECUTION_SCRIPT = 'cmd/load-balancer/execution.scheduler.ts true';
//#endregion Constants

/**
 * Script à lancer après un reset du jeu (installation d'augmentation).
 */
export async function main(ns: NS) {
    const serversRepository = new ServersRepository(ns);
    const executionsRepository: ExecutionsRepository = new ExecutionsRepository(ns);
    const moneyPiggyBankService: MoneyPiggyBankService = new MoneyPiggyBankService(ns);

    // reset reserve money
    moneyPiggyBankService.setReserveMoney(0);
    
    // TODO : objectif dépend de la vitesse de gain
    /*if (!ns.hasTorRouter()) {
        MoneyPiggyBank.setReserveMoney(ns, 200 * 1000);
    }*/

    // reset des bases de données
    serversRepository.reset();
    executionsRepository.reset();

    // lancement du hacking automatisé
    ns.run(INFECTION_SCRIPT);

    // TODO : lancement du gestionnaire d'embauche

    // lancement de l'achat de node automatisé
    ns.run(HACKNET_SCRIPT, 1, true);

    // lancement du hack automatisé
    ns.run(EXECUTION_SCRIPT, 1, true);

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
