/**
 * Attend la fin de l'execution ciblée.
 * 
 * @param ns Bitburner API
 * @param pidExecution id de l'execution ciblée
 * 
 * @remarks RAM cost: 0.1 GB
 */
export async function waitEndExecution(ns: NS, pidExecution: number): Promise<boolean> {
    // execution KO
    if (pidExecution === 0) {
        return false;
    }

    // wait execution end
    while (ns.isRunning(pidExecution)) {
        await ns.asleep(500);
    }

    return true;
}

/**
 * Attend la fin de des executions ciblées.
 * 
 * @param ns Bitburner API
 * @param pidExecutions ids des executions ciblées
 * 
 * @remarks RAM cost: 0.1 GB
 */
export async function waitEndAllExecutions(ns: NS, pidExecutions: number[]): Promise<boolean> {
    // wait execution end
    while (pidExecutions.filter(x => x !== 0).some(pid => ns.isRunning(pid))) {
        await ns.asleep(500);
    }

    return true;
}

/**
 * Vérifie si un script commun tourne déjà.
 * Si c'est le cas on termine le script actuel.
 * 
 * @param ns Bitburner API
 * 
 * @remarks RAM cost: 0.3 GB
 */
export function singletonValidation(ns: NS) {
    const currentScript: RunningScript = ns.getRunningScript();
    const script: RunningScript | null = ns.getRunningScript(currentScript.filename, currentScript.server, ...currentScript.args);
    if (script !== null && currentScript.pid !== script.pid) {
        ns.exit();
    }
}