import * as Referentiel from 'workspace/referentiel'
import {FitRamExecution} from 'workspace/load-balancer/model/FitRamExecution'

const REPOSITORY = Referentiel.FIT_RAM_EXECUTION_REPOSITORY;

/**
 * Récupère les executions enregistrées en base de données.
 * 
 * @param ns Bitburner API
 */
export function getAll(ns: NS, hostname: string) {
    if (!ns.fileExists(REPOSITORY + `/${hostname}.json`, 'home')) {
        // save data
        resetWith(ns, hostname, []);
    }

    return JSON.parse(ns.read(REPOSITORY + `/${hostname}.json`));
}

/**
 * Enregistre en base une nouvelle execution.
 * 
 * @param ns Bitburner API
 * @param hostname serveur qui porte l'execution
 * @param execution nouvelle execution
 */
export function add(ns: NS, hostname: string, execution: FitRamExecution) {
    // get last version of executions
    let executions: FitRamExecution[] = getAll(ns, hostname);

    // add execution
    executions.push(execution) ;

    // save data
    resetWith(ns, hostname, executions);
}

/**
 * Supprime une execution de la base de données.
 * 
 * @param ns Bitburner API
 * @param hostname serveur qui porte l'execution
 * @param pid id de l'execution
 */
export function remove(ns: NS, hostname: string, pid: number) {
    // get last version of executions
    let executions: FitRamExecution[] = getAll(ns, hostname);

    // remove execution
    executions = executions.filter(execution => execution.pid !== pid) ;

    // save data
    resetWith(ns, hostname, executions);
}

/**
 * Remise à zéro de la base de données.
 * 
 * @param ns Bitburner API
 */
export function reset(ns: NS) {
    let files: string[] = ns.ls('home', REPOSITORY)
        .filter((file: string) => file.startsWith(REPOSITORY));

    // suppression de toutes les données
    files.forEach(file => ns.rm(file));
}

/**
 * Remet à zéro la base de données avec les serveurs fournis en entrée.
 * 
 * @param ns Bitburner API
 * @param hostname serveur qui porte l'execution
 * @param executions executions à sauvegarder
 */
function resetWith(ns: NS, hostname: string, executions: FitRamExecution[]) {
    ns.write(REPOSITORY + `/${hostname}.json`, JSON.stringify(executions, null, 4), "w");
}
