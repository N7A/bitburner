import { UpgradeExecution } from 'workspace/load-balancer/model/UpgradeExecution'
import { UpgradeType } from 'workspace/load-balancer/model/UpgradeType'
import { main as copyToolkit } from 'workspace/resource-generator/hacking/spreading/copy-toolkit.launcher'
import * as Log from 'workspace/socle/utils/logging';
import { ServersRepository } from 'workspace/servers/domain/servers.repository';
import { ServersService } from 'workspace/servers/servers.service';

export async function executeUpgrade(ns: NS, upgrade: UpgradeExecution) {
    const serversRepository = new ServersRepository(ns);
    const serversService = new ServersService(ns);

    if (upgrade.upgradeType === UpgradeType.RAM) {
        ns.print('Upgrade de serveur');
        
        if (!upgrade.hostname) {
            ns.print('ERROR', ' ', 'Hostname à upgrade non défini')
            ns.exit();
        }

        if(ns.upgradePurchasedServer(upgrade.hostname, upgrade.ram)) {
            ns.toast(`{${upgrade.hostname}} upgrade to (${ns.formatRam(upgrade.ram)}) RAM for ${Log.money(ns, upgrade.cost)}`, ns.enums.ToastVariant.SUCCESS, 5000);
            serversRepository.refresh(upgrade.hostname);
        }
    } else if (upgrade.upgradeType === UpgradeType.SERVER) {
        ns.print('Achat de serveur');
        const hostnames = ['f1rst', 'se2ond', 'th3rd', 'fourt4'];
        const boughtServers: string[] = serversService.getOwned();
        const nextHostname: string = hostnames
            .filter(x => !boughtServers.includes(x))
            .shift() as string;
        ns.purchaseServer(nextHostname, upgrade.ram);
        // TODO : add upgrade.cost to server repo ?
        serversRepository.add(nextHostname);

        // copie du toolkit
        await copyToolkit(ns, nextHostname);
    }
}