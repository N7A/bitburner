import { getHash } from 'workspace/socle/utils/file'
import * as Referentiel from 'workspace/common/referentiel'

export async function main(ns: NS): Promise<void> {
    const hashes: Record<string,number> = {}

    // init footprint
    const files = ns.ls(Referentiel.MAIN_HOSTNAME, Referentiel.SCRIPT_EXTENSION);
    for (const file of files) {
        hashes[file] = getHash(ns, file);
    }

    while (true) {
        // get current scripts files
        const changedFiles = ns.ls(Referentiel.MAIN_HOSTNAME, Referentiel.SCRIPT_EXTENSION)
            .filter(file => {
                const newHash = getHash(ns, file);
                const change: boolean =  newHash != hashes[file];
                // maj footprint
                hashes[file] = newHash;
                return change;
            });

        for (const file of changedFiles) {
            ns.tprint(`INFO: Detected change in ${file}`)

            // TODO : copy to executable server
            
            // relaunch process
            const processes = ns.ps().filter((p: ProcessInfo) => {
                return p.filename == file
            });

            for (const process of processes) {
                ns.tprint(`INFO: Restarting ${process.filename} ${process.args} -t ${process.threads}`)
                if (process.filename != ns.getScriptName()) {
                    ns.kill(process.pid)
                    ns.run(process.filename, process.threads, ...process.args)
                } else {
                    ns.spawn(process.filename, process.threads, ...process.args)
                }
            }
        }

        await ns.sleep(1000)
    }
}