export async function main(ns: NS) {
    ns.ls('home', 'workspace').filter(x => x.endsWith('.js')).forEach(x => {
        const newPath = x.substring(0, x.lastIndexOf('.js')) + '.ts';
        ns.tprint(`${ns.fileExists(newPath) ? 'WARN' : 'SUCCESS'}`, ' ', `${x} -> ${newPath}`)
    })

    /*ns.ls('home', 'workspace').filter(x => x.endsWith('.js')).forEach(x => {
        ns.mv('home', x, x.substring(0, x.lastIndexOf('.js')) + '.ts')
    })*/
}