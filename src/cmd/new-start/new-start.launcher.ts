import * as Referentiel from 'workspace/referentiel'
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'
import * as Log from 'workspace/socle/logging';
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service'
import { ServersRepository } from 'workspace/servers/domain/servers.repository'
import { GangDirectiveRepository } from 'workspace/resource-generator/gang/domain/GangDirective.repository';

/**
 * Script à lancer après un reset du jeu (installation d'augmentation).
 */
export async function main(ns: NS) {
    const newStart = new NewStart(ns);

    newStart.run();
}

class NewStart {
    //#region Constants
    readonly INFECTION_SCRIPT = Referentiel.CMD_HACKING_DIRECTORY + '/infection/auto-infection.launcher.ts';
    readonly HACKNET_SCRIPT = Referentiel.HACKNET_DIRECTORY + '/upgrade-hacknet.scheduler.ts';
    readonly EXECUTION_SCRIPT = 'cmd/load-balancer/execution.scheduler.ts';
    //#endregion Constants

    private ns: NS;
    private serversRepository: ServersRepository;
    private executionsRepository: ExecutionsRepository;
    private moneyPiggyBankService: MoneyPiggyBankService;
    private gangDirectiveRepository: GangDirectiveRepository;

    constructor(ns: NS) {
        this.ns = ns;
        this.serversRepository = new ServersRepository(ns);
        this.executionsRepository = new ExecutionsRepository(ns);
        this.moneyPiggyBankService = new MoneyPiggyBankService(ns);
        this.gangDirectiveRepository = new GangDirectiveRepository(ns);
    }

    run() {
        this.resetRepositories();

        this.startScripts();

        this.showTodo();
    }

    private resetRepositories() {
        // reset reserve money
        this.moneyPiggyBankService.setReserveMoney(0);
        
        // TODO : objectif dépend de la vitesse de gain
        /*if (!ns.hasTorRouter()) {
            MoneyPiggyBank.setReserveMoney(ns, 200 * 1000);
        }*/

        // reset des bases de données
        this.serversRepository.reset();
        this.executionsRepository.reset();
        this.gangDirectiveRepository.reset();
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

    /**
     * Affichage de la TODO list et informations diverses
     */
    private showTodo() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
        
        Log.initTailTitle(this.ns, 'TODO');

        // TODO : compléter
        this.ns.print(Log.getStartLog());
        this.ns.print('[ ] Go get a job');
        this.ns.print('[ ] Run alias');
        this.ns.print('[ ] Go to City > [alpha ent.]; Purchase TOR router; cmd : buy -l')
        this.ns.print(Log.getEndLog());

        this.ns.ui.openTail();
    }
}