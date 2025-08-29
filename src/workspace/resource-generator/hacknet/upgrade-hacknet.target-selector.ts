import { HacknetUpgrade } from 'workspace/resource-generator/hacknet/model/HacknetUpgrade'
import { UpgradeExecution } from 'workspace/resource-generator/hacknet/model/UpgradeExecution'
import { UpgradeType } from 'workspace/resource-generator/hacknet/model/UpgradeType'

// TODO: ns.formulas.hacknetNodes
/**
 * @remarks RAM cost: 4.25GB
 */
export function getBestProfits(ns: NS, maxMoneyToSpend?: number): UpgradeExecution | undefined {
    // load profits disponibles
    let profits: UpgradeExecution[] = getProfits(ns, maxMoneyToSpend)
    // check if you have enough money for any upgrade
    .filter(upgradeRatio => maxMoneyToSpend === undefined || upgradeRatio.cost <= maxMoneyToSpend);

    // find the most profitability upgrade
    return profits.sort((a, b) => a.ratio - b.ratio).pop();
}

function getProfits(ns: NS, maxMoneyToSpend?: number): UpgradeExecution[] {
    let profits: UpgradeExecution[] = [];
    
    if (ns.hacknet.numNodes() < ns.hacknet.maxNumNodes()) {
        profits.push(getProfitBuy(ns, 1));
    }
    
    for (var i = 0; i < ns.hacknet.numNodes(); i++) {
        const profit = getProfitUpgradeNode(ns, i, maxMoneyToSpend);
        profits.push(...profit);
    }

    return profits;
}

/**
 * Ratio = Production growth divided by Upgrade Cost
 * Production growth = Production after upgrade divided by Current production
 */
function getProfitUpgradeNode(ns: NS, nodeIndex: number, maxMoneyToSpend?: number): UpgradeExecution[] {
    // TODO : max level 200 -> n+1
    // max RAM 64 -> n*2
    // max core 16 -> n+1
    // what append when max ?

    let nbLevelUpgrade: number = 1;
    let nbRamUpgrade: number = 1;
    let nbCoreUpgrade: number = 1;

    // recherche de la quantité maximum d'upgrade possible
    if (maxMoneyToSpend !== undefined) {
        const lvlUp = getUpgrade(ns, UpgradeType.LEVEL) as HacknetUpgrade;
        while(lvlUp.getCost(nodeIndex, nbLevelUpgrade+1) <= maxMoneyToSpend) {
            nbLevelUpgrade++;
        }
        const ramUp = getUpgrade(ns, UpgradeType.RAM) as HacknetUpgrade;
        while(ramUp.getCost(nodeIndex, nbRamUpgrade+1) <= maxMoneyToSpend) {
            nbRamUpgrade++;
        }
        const coreUp = getUpgrade(ns, UpgradeType.CORES) as HacknetUpgrade;
        while(coreUp.getCost(nodeIndex, nbCoreUpgrade+1) <= maxMoneyToSpend) {
            nbCoreUpgrade++;
        }
    }

    return [
        getProfitUpgrade(ns, getUpgrade(ns, UpgradeType.LEVEL) as HacknetUpgrade, nodeIndex, nbLevelUpgrade),
        getProfitUpgrade(ns, getUpgrade(ns, UpgradeType.RAM) as HacknetUpgrade, nodeIndex, nbRamUpgrade),
        getProfitUpgrade(ns, getUpgrade(ns, UpgradeType.CORES) as HacknetUpgrade, nodeIndex, nbCoreUpgrade)
    ];
}

export function getUpgrade(ns: NS, type: UpgradeType): HacknetUpgrade|undefined {
    return getPossibleUpgrade(ns).filter(x => x.type == type).shift();
}

function getPossibleUpgrade(ns: NS): HacknetUpgrade[]  {
    return [
        {
            type: UpgradeType.LEVEL,
            prodGrowthAfterUpgrade: (nodeStats: NodeStats, upgradeNumber: number, prodMultiplier: number) => {
                const curRam = nodeStats.ram;
                const curLevel = nodeStats.level;
                const curCores = nodeStats.cores;
                const curProd = nodeStats.production;
                return (getProduction(curLevel + upgradeNumber, curRam, curCores) * prodMultiplier) - curProd;
            },
            executeFunction: ns.hacknet.upgradeLevel,
            getCost: ns.hacknet.getLevelUpgradeCost
        },
        {
            type: UpgradeType.RAM,
            prodGrowthAfterUpgrade: (nodeStats: NodeStats, upgradeNumber: number, prodMultiplier: number) => {
                const curRam = nodeStats.ram;
                const curLevel = nodeStats.level;
                const curCores = nodeStats.cores;
                const curProd = nodeStats.production;
                return (getProduction(curLevel, curRam * 2*upgradeNumber, curCores) * prodMultiplier) - curProd;
            },
            executeFunction: ns.hacknet.upgradeRam,
            getCost: ns.hacknet.getRamUpgradeCost
        },
        {
            type: UpgradeType.CORES,
            prodGrowthAfterUpgrade: (nodeStats: NodeStats, upgradeNumber: number, prodMultiplier: number) => {
                const curRam = nodeStats.ram;
                const curLevel = nodeStats.level;
                const curCores = nodeStats.cores;
                const curProd = nodeStats.production;
                return (getProduction(curLevel, curRam, curCores + upgradeNumber) * prodMultiplier) - curProd;
            },
            executeFunction: ns.hacknet.upgradeCore,
            getCost: ns.hacknet.getCoreUpgradeCost
        }
    ];
}

function getProfitUpgrade(ns: NS, hacknetUpgrade: HacknetUpgrade, index: number, upgradeNumber: number): UpgradeExecution {
    // production multiplier from installed augmentations
    const prodMultiplier = ns.getHacknetMultipliers().production;

    // get current node stats
    const nodeStats = ns.hacknet.getNodeStats(index);

    // get costs of upgrades
    const upgradeCost = hacknetUpgrade.getCost(index, upgradeNumber);

    // check upgrades profitability and if you have enough money
    // UPGRADE RATIO = production growth after upgrade / current production
    const potentielProdGrowth = hacknetUpgrade.prodGrowthAfterUpgrade(nodeStats, upgradeNumber, prodMultiplier);
    let upgradeRatio: UpgradeExecution = {
        index: index,
        upgradeType: hacknetUpgrade.type,
        ratio: potentielProdGrowth / upgradeCost,
        quantite: upgradeNumber,
        cost: upgradeCost
    }

    return upgradeRatio;
}

function getProfitBuy(ns: NS, upgradeNumber: number): UpgradeExecution {
    // production multiplier from installed augmentations
    const prodMultiplier = ns.getHacknetMultipliers().production;

    // get costs of buy
    const cost = ns.hacknet.getPurchaseNodeCost();

    // check upgrades profitability
    const poptentielProdGrowth = (getProduction(1, 1, 1) * prodMultiplier) * upgradeNumber;
    const ratio = poptentielProdGrowth / cost;
    let upgradeRatio: UpgradeExecution = {
        upgradeType: UpgradeType.NODE,
        ratio: ratio,
        quantite: upgradeNumber,
        cost: cost
    }

    return upgradeRatio;
}

function getProduction(level: number, ram: number, cores: number) {
    return (level * 1.5) * Math.pow(1.035, ram - 1) * ((cores + 5) / 6)
}
