import { UpgradeExecution } from 'workspace/load-balancer/model/UpgradeExecution'
import { UpgradeType } from 'workspace/load-balancer/model/UpgradeType'
import { ServerData } from 'workspace/servers/domain/model/ServerData';
import { ServersService } from 'workspace/servers/servers.service';

export async function selectUpgrade(ns: NS, maxMoneyToSpend?: number): Promise<UpgradeExecution> {
    const serversService = new ServersService(ns);
    let upgradableServers: ServerData[] = serversService.getAllUpgradable();

    upgradableServers = upgradableServers.sort((a, b) => a.hackData.maxRam - b.hackData.maxRam);

    const serverToUp = upgradableServers.shift();
    if (serverToUp) {
        // TODO : verifier si le serveur est upgraadable avant
        return await getProfitUpgrade(ns, serverToUp, maxMoneyToSpend);
    } else if (upgradableServers.length < ns.getPurchasedServerLimit()) {
        return await getProfitBuy(ns, maxMoneyToSpend);
    }
    
}

async function getProfitUpgrade(ns: NS, server: ServerData, maxMoneyToSpend?: number): Promise<UpgradeExecution> {
    let pow = 1;

    if (maxMoneyToSpend !== undefined) {
        // found max upgrade possible
        ns.print('Recherche de la RAM maximum');
        let nextCost = ns.getPurchasedServerUpgradeCost(server.name, getNewRam(server.hackData.maxRam, pow+1));
        while (
            !Number.isFinite(nextCost)
            && nextCost < maxMoneyToSpend 
            && getNewRam(server.hackData.maxRam, pow+1) <= ns.getPurchasedServerMaxRam()
        ) {
            pow++;
            await ns.sleep(500);
            nextCost = ns.getPurchasedServerUpgradeCost(server.name, getNewRam(server.hackData.maxRam, pow+1));
        }
    }

    let ram = getNewRam(server.hackData.maxRam, pow);
    
    return {
        hostname: server.name,
        upgradeType: UpgradeType.RAM,
        ram: ram,
        cost: ns.getPurchasedServerUpgradeCost(server.name, ram)
    }
}

async function getProfitBuy(ns: NS, maxMoneyToSpend?: number): Promise<UpgradeExecution> {
    let pow = 1;
    let ram = 2**pow;

    if (maxMoneyToSpend) {
        // found max ram possible
        ns.print('Recherche de la RAM maximum achetable...');
        while (ns.getPurchasedServerCost(getNewRam(ram, pow+1)) < maxMoneyToSpend && getNewRam(ram, pow+1) <= ns.getPurchasedServerMaxRam()) {
            pow++;
            await ns.sleep(300);
        }
        
        let message = `RAM achetable : ${ns.formatRam(getNewRam(ram, pow))}`;

        if (ns.getPurchasedServerMaxRam()) {
            message = `RAM achetable (max) : ${ns.formatRam(getNewRam(ram, pow))}`
        }
        ns.print(message);
    }
    ram = getNewRam(ram, pow)

    let upgradeRatio: UpgradeExecution = {
        upgradeType: UpgradeType.SERVER,
        ram: ram,
        cost: ns.getPurchasedServerCost(ram)
    }

    return upgradeRatio;
}

function getNewRam(ram: number, pow: number): number { return ram*(2**pow) }