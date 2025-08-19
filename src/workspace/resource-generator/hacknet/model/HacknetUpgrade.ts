import { UpgradeType } from 'workspace/resource-generator/hacknet/model/UpgradeType'

export type HacknetUpgrade = {
    type: UpgradeType;
    getCost: (index: number, n?: number | undefined) => number;
    prodGrowthAfterUpgrade: (nodeStats: NodeStats, upgradeNumber: number, prodMultiplier: number) => number;
    executeFunction: (index: number, n?: number | undefined) => boolean;
}