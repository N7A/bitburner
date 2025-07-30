import { UpgradeExecution } from 'workspace/load-balancer/model/UpgradeExecution'
import { UpgradeType } from 'workspace/load-balancer/model/UpgradeType'
import {OwnedServer} from 'workspace/load-balancer/model/OwnedServer'
import * as OwnedServersRepository from 'workspace/domain/owned-servers.repository'
import { main as copyToolkit } from 'workspace/hacking/spreading/copy-toolkit.launcher'

export async function executeUpgrade(ns: NS, upgrade: UpgradeExecution) {
    if (upgrade.upgradeType === UpgradeType.RAM) {
        ns.print('Upgrade de serveur');
        
        if (!upgrade.hostname) {
            ns.print('ERROR', ' ', 'Hostname à upgrade non défini')
            ns.exit();
        }

        if(ns.upgradePurchasedServer(upgrade.hostname, upgrade.ram)) {
            ns.toast(`{${upgrade.hostname}} upgrade to (${ns.formatRam(upgrade.ram)}) RAM for \$${upgrade.cost}`, ns.enums.ToastVariant.SUCCESS, 5000);
            let serverToUp = OwnedServersRepository.get(ns, upgrade.hostname);
            if (serverToUp) {
                serverToUp.ram = upgrade.ram;
                OwnedServersRepository.save(ns, serverToUp);
            }
        }
    } else if (upgrade.upgradeType === UpgradeType.SERVER) {
        ns.print('Achat de serveur');
        const hostnames = ['f1rst', 'se2ond', 'th3rd', 'fourt4'];
        let ownedServers: OwnedServer[] = OwnedServersRepository.getAll(ns)
            .filter(x => x.hostname !== 'home');
        const nextHostname: string = hostnames
            .filter(x => !ownedServers.map(owned => owned.hostname).includes(x))
            .shift() as string;
        ns.purchaseServer(nextHostname, upgrade.ram);
        let newServer: OwnedServer = {
            hostname: nextHostname,
            ram: upgrade.ram,
            cost: upgrade.cost
        }
        OwnedServersRepository.add(ns, newServer);

        // copie du toolkit
        await copyToolkit(ns, nextHostname);
    }
}