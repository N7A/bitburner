import * as Referentiel from 'workspace/referentiel'
import {Order} from 'workspace/domain/executions/model/Order'

const REPOSITORY = Referentiel.EXECUTION_ORDERS_REPOSITORY;

/**
 * Récupère les executions enregistrées en base de données.
 * 
 * @param ns Bitburner API
 */
export function getAll(ns: NS): Order[] {
    return JSON.parse(ns.read(REPOSITORY));
}

/**
 * Enregistre en base une nouvelle execution.
 * 
 * @param ns Bitburner API
 * @param execution nouvelle execution
 */
export function add(ns: NS, execution: Order) {
    // get last version of executions
    let executions: Order[] = getAll(ns);

    // add execution
    executions.push(execution);

    // save data
    resetWith(ns, executions);
}

/**
 * Supprime une execution de la base de données.
 * 
 * @param ns Bitburner API
 * @param executionToRemove execution à supprimer
 */
export function remove(ns: NS, executionToRemove: Order) {
    // get last version of executions
    let executions: Order[] = getAll(ns);

    // remove execution
    executions = executions.filter(execution => {
        return execution.type !== executionToRemove.type && execution.target !== executionToRemove.target
    });

    // save data
    resetWith(ns, executions);
}

/**
 * Remise à zéro de la base de données.
 * 
 * @param ns Bitburner API
 */
export function reset(ns: NS) {
    let executions: Order[] = [];

    // save data
    resetWith(ns, executions);
}

/**
 * Remet à zéro la base de données avec les données fournis en entrée.
 * 
 * @param ns Bitburner API
 * @param hostname serveur qui porte l'execution
 * @param executions executions à sauvegarder
 */
function resetWith(ns: NS, executions: Order[]) {
    ns.write(REPOSITORY, JSON.stringify(executions, null, 4), "w");
}
