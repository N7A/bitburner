/**
 * Attend la fin de l'execution ciblé.
 * 
 * @param ns Bitburner API
 * @param pidExecution id de l'execution ciblé
 * RAM : 0.1 GB
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