import { HacknetUpgrade } from 'workspace/resource-generator/hacknet/model/HacknetUpgrade'
import { UpgradeExecution } from 'workspace/resource-generator/hacknet/model/UpgradeExecution'
import { UpgradeType } from 'workspace/resource-generator/hacknet/model/UpgradeType'

// TODO: ns.formulas.hacknetNodes
/*
ns.tprint(ns.formatNumber(ns.hacknet.getPurchaseNodeCost()))
ns.tprint(ns.formatNumber(ns.formulas.hacknetNodes.hacknetNodeCost(ns.hacknet.numNodes()+1, ns.getPlayer().mults.hacknet_node_purchase_cost)));

ns.tprint(ns.formatNumber(ns.hacknet.getCoreUpgradeCost(0, 1)));
ns.tprint(ns.formatNumber(ns.formulas.hacknetNodes.coreUpgradeCost(0, 1, ns.getPlayer().mults.hacknet_node_core_cost)));
*/
/**
 * @remarks RAM cost: 4.25GB
 */
export function getBestTarget(ns: NS, maxMoneyToSpend?: number): UpgradeExecution | undefined {
    // load profits disponibles
    let profits: UpgradeExecution[] = getProfits(ns, maxMoneyToSpend)
    // check if you have enough money for any upgrade
    .filter(upgradeRatio => maxMoneyToSpend === undefined || upgradeRatio.cost <= maxMoneyToSpend);

    // find the most profitability upgrade
    return profits.sort((a, b) => a.ratio * b.cost - b.ratio * a.cost).pop();
}

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
    let result: UpgradeExecution[] = [];

    // recherche de la quantité maximum d'upgrade possible
    if (maxMoneyToSpend !== undefined) {
        [
            UpgradeType.LEVEL, 
            UpgradeType.RAM, 
            UpgradeType.CORES
        ].forEach(upgradeType => {
            const upgrade = getUpgrade(ns, upgradeType) as HacknetUpgrade;
            // le nombre maximum d'upgrade n'est pas encore atteind
            if (upgrade.getCost(nodeIndex) !== Number.POSITIVE_INFINITY) {
                let nbUpgrade: number = 1;
                while(upgrade.getCost(nodeIndex, nbUpgrade + 1) <= maxMoneyToSpend) {
                    nbUpgrade++;
                }
                result.push(getProfitUpgrade(ns, upgrade, nodeIndex, nbUpgrade));
            }
        });
    }

    return result;
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
