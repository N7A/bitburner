export async function main(ns: NS) {
    ns.print('WARN', ' ', 'Pas d\'access root')
    ns.tprint('ERROR', ' ', 'Pas d\'access root')
    ns.print(ns.getRunningScript())
    ns.print(ns.ps())
    ns.toast('oui')

    
    ns.clearPort(1)
    ns.writePort(1, '0')
    ns.tprint(ns.readPort(1))
    ns.tprint(ns.readPort(1))
}