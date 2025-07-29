import { UpgradeType } from 'workspace/load-balancer/model/UpgradeType'

export type UpgradeExecution = {
    hostname?: string;
    upgradeType: UpgradeType;
    ram: number;
    cost: number;
}