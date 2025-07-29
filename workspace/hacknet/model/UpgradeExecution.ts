import { UpgradeType } from 'workspace/hacknet/model/UpgradeType'

export type UpgradeExecution = {
    index?: number;
    upgradeType: UpgradeType;
    ratio: number;
    quantite: number;
    cost: number;
}