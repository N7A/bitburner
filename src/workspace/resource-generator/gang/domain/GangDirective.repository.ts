import * as Referentiel from 'workspace/referentiel'
import { GangDirective } from 'workspace/resource-generator/gang/domain/model/GangDirective';
import { WantedLvl } from './model/WantedLvl';
import { TaskType } from '../model/TaskType';

const REPOSITORY = Referentiel.REPOSITORIES_DIRECTORY + '/gang-task.json';

/**
 * Persiste les paramètres pour les tâches du gang.
 * 
 * @remarks Ram cost : 0.1 GB
 */
// INFO : repository instead of application .properties because rechargement à chaud + setup values by script
export class GangDirectiveRepository {

    private ns: NS;

    constructor(ns: NS) {
        this.ns = ns
    }

    /**
     * Récupère les données enregistrées en base de données.
     * 
     * @param ns Bitburner API
     * 
     * @remarks Ram cost : 0.1 GB
     */
    get(): GangDirective {
        if (!this.ns.fileExists(REPOSITORY)) {
            this.reset();
        }

        let directive: GangDirective = JSON.parse(this.ns.read(REPOSITORY));
        directive.tasksWeight = new Map(Object.entries(directive.tasksWeight));

        return directive;
    }

    /**
     * Remet à zéro la base de données avec les données fournis en entrée.
     * 
     * @param ns Bitburner API
     * @param bank data to save
     * 
     * @remarks Ram cost : 0 GB
     */
    save(directive: GangDirective): void {
        // conversion des maps en objet (nécessaire pour l'enregistrement au format JSON)
        directive.tasksWeight = Object.fromEntries(directive.tasksWeight as Map<string, number>);
        // save data
        this.ns.write(REPOSITORY, JSON.stringify(directive, null, 4), "w");
    }

    /**
     * Remise à zéro de la base de données.
     * 
     * @param ns Bitburner API
     * 
     * @remarks Ram cost : 0 GB
     */
    reset(): void {
        const directive: GangDirective = {
            wantedLvl: WantedLvl.ZERO_BY_SECOND, 
            tasksWeight: [
                [TaskType.UP_MONEY, 1],
                [TaskType.UP_REPUTATION, 1],
                [TaskType.POWER_TERRITORY, 1]
            ]
        };

        // save data
        this.save(directive);
    }
    
}