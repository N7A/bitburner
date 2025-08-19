import { UpgradeType } from 'workspace/resource-generator/hacknet/model/UpgradeType'

export type UpgradeExecution = {
    index?: number;
    upgradeType: UpgradeType;
    ratio: number;
    quantite: number;
    cost: number;
}