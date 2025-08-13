export async function main(ns: NS): Promise<void> {
    const hashes: Record<string,number> = {}

    // init footprint
    // TODO : add repositories .json ?
    const files = ns.ls('home', '.js')
    for (const file of files) {
        const contents = ns.read(file)
        hashes[file] = getHash(contents)
    }

    while (true) {
        // get current scripts files
        const files = ns.ls('home', '.js')

        for (const file of files) {
            const contents = ns.read(file)
            const hash = getHash(contents)

            if (hash != hashes[file]) {
                ns.tprint(`INFO: Detected change in ${file}`)

                // TODO : copy to owned server
                
                // relaunch process
                const processes = ns.ps().filter((p: ProcessInfo) => {
                    return p.filename == file
                })

                for (const process of processes) {
                    ns.tprint(`INFO: Restarting ${process.filename} ${process.args} -t ${process.threads}`)
                    if (process.filename != ns.getScriptName()) {
                        ns.kill(process.pid)
                        ns.run(process.filename, process.threads, ...process.args)
                    } else {
                        ns.spawn(process.filename, process.threads, ...process.args)
                    }
                }

                // maj footprint
                hashes[file] = hash
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