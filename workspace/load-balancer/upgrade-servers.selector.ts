import {OwnedServer} from 'workspace/load-balancer/model/OwnedServer'
import * as OwnedServersRepository from 'workspace/domain/owned-servers.repository'
import { UpgradeExecution } from 'workspace/load-balancer/model/UpgradeExecution'
import { UpgradeType } from 'workspace/load-balancer/model/UpgradeType'

export async function selectUpgrade(ns: NS, maxMoneyToSpend?: number): Promise<UpgradeExecution> {
    let upgradableServers: OwnedServer[] = OwnedServersRepository.getAll(ns)
        .filter(x => x.hostname !== 'home')
        .filter(x => x.ram < ns.getPurchasedServerMaxRam());

    if (upgradableServers.some(x => x.ram === undefined)) {
        OwnedServersRepository.reset(ns);
    }

    upgradableServers = upgradableServers.sort((a, b) => a.ram - b.ram);

    const serverToUp = upgradableServers.shift();
    if (serverToUp) {
        return await getProfitUpgrade(ns, serverToUp, maxMoneyToSpend);
    } else {
        return await getProfitBuy(ns, maxMoneyToSpend);
    }
    
}

async function getProfitUpgrade(ns: NS, server: OwnedServer, maxMoneyToSpend?: number): Promise<UpgradeExecution> {
    let pow = 1;

    if (maxMoneyToSpend !== undefined) {
        // found max upgrade possible
        ns.print('Recherche de la RAM maximum');
        let nextCost = ns.getPurchasedServerUpgradeCost(server.hostname, getNewRam(server.ram, pow+1));
        while (nextCost < maxMoneyToSpend && getNewRam(server.ram, pow+1) <= ns.getPurchasedServerMaxRam()) {
            pow++;
            await ns.sleep(500);
            nextCost = ns.getPurchasedServerUpgradeCost(server.hostname, getNewRam(server.ram, pow+1));
        }
    }

    let ram = getNewRam(server.ram, pow);
    
    return {
        hostname: server.hostname,
        upgradeType: UpgradeType.RAM,
        ram: ram,
        cost: ns.getPurchasedServerUpgradeCost(server.hostname, ram)
    }
}

async function getProfitBuy(ns: NS, maxMoneyToSpend?: number): Promise<UpgradeExecution> {
    let pow = 1;
    let ram = 2**pow;

    if (maxMoneyToSpend) {
        // found max ram possible
        ns.print('Recherche de la RAM maximum');
        ns.print('Max RAM : ', ns.getPurchasedServerMaxRam());
        while (ns.getPurchasedServerCost(getNewRam(ram, pow+1)) < maxMoneyToSpend && getNewRam(ram, pow+1) <= ns.getPurchasedServerMaxRam()) {
            pow++;
            ns.print('RAM : ', getNewRam(ram, pow));
            await ns.sleep(500);
        }
    }
    ram = getNewRam(ram, pow)

    let upgradeRatio: UpgradeExecution = {
        upgradeType: UpgradeType.SERVER,
        ram: ram,
        cost: ns.getPurchasedServerCost(ram)
    }

    return upgradeRatio;
}

function getNewRam(ram: number, pow: number) { return ram*(2**pow) }