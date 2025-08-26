export async function main(ns: NS): Promise<void> {
    const hashes: Record<string,number> = {}

    // init footprint
    const files = ns.ls('home', '.ts');
    for (const file of files) {
        const contents = ns.read(file)
        hashes[file] = getHash(contents)
    }

    while (true) {
        // get current scripts files
        const changedFiles = ns.ls('home', '.ts')
            .filter(file => {
                const contents = ns.read(file);
                const newHash = getHash(contents);
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

const getHash = (input: string): number => {
    let hash = 0;
    for (const char of input) {
        hash = ((hash << 5) - hash) + char.charCodeAt(0);
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}