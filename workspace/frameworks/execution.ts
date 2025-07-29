/**
 * Attend la fin de l'execution ciblé.
 * 
 * @param ns Bitburner API
 * @param pidExecution id de l'execution ciblé
 * RAM : 0,10GB
 */
export async function waitEndExecution(ns: NS, pidExecution: number) {
    // execution KO
    if (pidExecution === 0) {
        return;
    }

    // wait execution end
    while (ns.isRunning(pidExecution)) {
        await ns.asleep(500);
    }
}