import * as Referentiel from 'workspace/common/referentiel'
import * as Log from 'workspace/socle/utils/logging';
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service'
import { ServersRepository } from 'workspace/servers/domain/servers.repository'
import { GangDirectiveRepository } from 'workspace/resource-generator/gang/domain/GangDirective.repository';
import { ExecutionOrdersService } from 'workspace/load-balancer/execution-orders.service';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { GameService } from 'workspace/game/game.service';
import { MemberNamesRepository } from "workspace/resource-generator/gang/domain/MemberNamesRepository";
import { PiggyBankRepository } from "workspace/piggy-bank/domain/piggy-bank.repository";

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
    private dashboard: Dashboard;
    private serversRepository: ServersRepository;
    private executionOrdersService: ExecutionOrdersService;
    private moneyPiggyBankService: MoneyPiggyBankService;
    private piggyBankRepository: PiggyBankRepository;
    private gangDirectiveRepository: GangDirectiveRepository;
    private memberNamesRepository: MemberNamesRepository;
    private gameService: GameService;

    constructor(ns: NS) {
        this.ns = ns;
        this.dashboard = new Dashboard(ns, 'TODO', {icon: '📋'});
        this.serversRepository = new ServersRepository(ns);
        this.executionOrdersService = new ExecutionOrdersService(ns);
        this.moneyPiggyBankService = new MoneyPiggyBankService(ns);
        this.piggyBankRepository = new PiggyBankRepository(ns);
        this.gangDirectiveRepository = new GangDirectiveRepository(ns);
        this.gameService = new GameService(ns);
        this.memberNamesRepository = new MemberNamesRepository(ns)
    }

    run() {
        this.resetRepositories();

        this.startScripts();

        this.showTodo();
    }

    private resetRepositories() {
        
        // reset des bases de données
        this.serversRepository.reset();
        this.memberNamesRepository.reset();
        this.executionOrdersService.reset();
        this.piggyBankRepository.reset();
        this.gangDirectiveRepository.reset();
        this.memberNamesRepository.reset();
        this.gameService.reset();

        // reset reserve money
        this.moneyPiggyBankService.setReserveMoney(0);
        // TODO : objectif dépend de la vitesse de gain
        /*if (!ns.hasTorRouter()) {
            MoneyPiggyBank.setReserveMoney(ns, 200 * 1000);
        }*/
    }

    private startScripts() {
        // lancement du unlock automatisé
        this.ns.run(this.INFECTION_SCRIPT, {preventDuplicates: true});

        // TODO : lancement du gestionnaire d'embauche

        // lancement de l'achat de node automatisé
        this.ns.run(this.HACKNET_SCRIPT, {preventDuplicates: true});

        // lancement du hacking automatisé
        this.ns.run(this.EXECUTION_SCRIPT, {preventDuplicates: true});
    }

    /**
     * Affichage de la TODO list et informations diverses
     */
    private showTodo() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
        
        this.dashboard.initTailTitle();

        // TODO : compléter
        this.ns.print(Log.getStartLog());
        this.ns.print('[ ] Go get a job');
        this.ns.print('[ ] Run alias');
        this.ns.print('[ ] Go to City > [alpha ent.]; Purchase TOR router; cmd : buy -l')
        this.ns.print(Log.getEndLog());

        this.ns.ui.openTail();
    }
}