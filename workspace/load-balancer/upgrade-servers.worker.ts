import { UpgradeExecution } from 'workspace/load-balancer/model/UpgradeExecution'
import { UpgradeType } from 'workspace/load-balancer/model/UpgradeType'
import { main as copyToolkit } from 'workspace/hacking/spreading/copy-toolkit.launcher'
import * as Log from 'workspace/frameworks/logging';
import { ServersRepository } from 'workspace/domain/servers/servers.repository';
import { ServerData, ServerType } from 'workspace/domain/servers/model/ServerData'

export async function executeUpgrade(ns: NS, upgrade: UpgradeExecution) {
    if (upgrade.upgradeType === UpgradeType.RAM) {
        ns.print('Upgrade de serveur');
        
        if (!upgrade.hostname) {
            ns.print('ERROR', ' ', 'Hostname à upgrade non défini')
            ns.exit();
        }

        if(ns.upgradePurchasedServer(upgrade.hostname, upgrade.ram)) {
            ns.toast(`{${upgrade.hostname}} upgrade to (${ns.formatRam(upgrade.ram)}) RAM for ${Log.money(ns, upgrade.cost)}`, ns.enums.ToastVariant.SUCCESS, 5000);
            ServersRepository.refresh(ns, upgrade.hostname);
        }
    } else if (upgrade.upgradeType === UpgradeType.SERVER) {
        ns.print('Achat de serveur');
        const hostnames = ['f1rst', 'se2ond', 'th3rd', 'fourt4'];
        let boughtServers: ServerData[] = ServersRepository.getAll(ns)
            .map(x => ServersRepository.get(ns, x))
            .filter(x => x.type === ServerType.BOUGHT);
        const nextHostname: string = hostnames
            .filter(x => !boughtServers.map(x => x.name).includes(x))
            .shift() as string;
        ns.purchaseServer(nextHostname, upgrade.ram);
        // TODO : add upgrade.cost to server repo ?
        ServersRepository.add(ns, nextHostname);

        // copie du toolkit
        await copyToolkit(ns, nextHostname);
    }
}