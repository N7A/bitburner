import * as Referentiel from 'workspace/referentiel'

export async function main(ns: NS) {
    // execution du premier scan
    const pidScan = ns.run(Referentiel.HACKING_DIRECTORY + '/scan/scan.launcher.ts');
    
    // attendre la fin du scan
    while (pidScan != 0 && ns.isRunning(pidScan)) {
        await ns.asleep(500);
    }

    ns.run(Referentiel.HACKING_DIRECTORY + '/infection/infection.looper.ts');
}