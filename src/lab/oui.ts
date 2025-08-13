export async function main(ns: NS, hostnameTarget: string) {
    if (ns.args.length> 0){
    hostnameTarget = (ns.args[0] as string)}
    ns.tprint(hostnameTarget)
}