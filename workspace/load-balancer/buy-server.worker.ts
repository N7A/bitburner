import {OwnedServer} from 'workspace/load-balancer/model/OwnedServer'
import * as OwnedServersRepository from 'workspace/domain/owned-servers.repository'
import { main as copyToolkit } from 'workspace/hacking/spreading/copy-toolkit.launcher'

export async function main(ns: NS) {
    let ownedServers: OwnedServer[] = OwnedServersRepository.getAll(ns)
        .filter(x => x.hostname !== 'home');

    ns.ui.openTail();
    
    if (ownedServers.some(x => x.ram === undefined)) {
        OwnedServersRepository.reset(ns);
    }

    ownedServers = ownedServers.sort((a, b) => a.ram - b.ram);

    const serverToUp = ownedServers.shift();
    const getNewRam = (ram: number, pow: number) => ram*(2**pow);
    if (serverToUp) {
        ns.print('Upgrade de serveur');
        let pow = 1;
        const cost = ns.getPurchasedServerUpgradeCost(serverToUp.hostname, getNewRam(serverToUp.ram, pow));
        // wait until upgrade possible
        while (cost > ns.getPlayer().money) {
            await ns.sleep(500);
        }
        // found max upgrade possible
        ns.print('Recherche de la RAM maximum');
        while (ns.getPurchasedServerUpgradeCost(serverToUp.hostname, getNewRam(serverToUp.ram, pow+1)) < ns.getPlayer().money) {
            pow++;
            await ns.sleep(500);
        }

        ns.tprint('Pow : ', pow);
        let ram = getNewRam(serverToUp.ram, pow);
        if(ns.upgradePurchasedServer(serverToUp.hostname, ram)) {
            const cost = ns.formatNumber(ns.getPurchasedServerUpgradeCost(serverToUp.hostname, ram));
            ns.toast(`{${serverToUp.hostname}} upgrade to (${ns.formatRam(ram)}) RAM for \$${cost}`, ToastVariant.SUCCESS, 5000);
            serverToUp.ram = ram;
            OwnedServersRepository.save(ns, serverToUp);
        }
    } else {
        ns.print('Achat de serveur');
        const hostnames = ['f1rst', 'se2ond', 'th3rd'];
        let pow = 0;
        let ram = 2**pow;
        const cost = ns.getPurchasedServerCost(ram);
        // wait until buy possible
        while (cost > ns.getPlayer().money) {
            await ns.sleep(500);
        }
        // found max ram possible
        ns.print('Recherche de la RAM maximum');
        ns.print('Max RAM : ', ns.getPurchasedServerMaxRam());
        while (ns.getPurchasedServerCost(getNewRam(ram, pow+1)) < ns.getPlayer().money && getNewRam(ram, pow+1) <= ns.getPurchasedServerMaxRam()) {
            pow++;
            ns.print('RAM : ', getNewRam(ram, pow));
            await ns.sleep(500);
        }
        ram = getNewRam(ram, pow)
        const nextHostname: string = hostnames
            .filter(x => !ownedServers.map(owned => owned.hostname).includes(x))
            .shift() as string;
        ns.purchaseServer(nextHostname, ram);
        let newServer: OwnedServer = {
            hostname: nextHostname,
            ram: ram,
            cost: cost
        }
        OwnedServersRepository.add(ns, newServer);

        // copie du toolkit
        copyToolkit(ns, nextHostname);
    }
    
}