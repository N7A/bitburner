import { WseUpgrade } from 'workspace/resource-generator/stock-market/model/WseUpgrade'
import { GameRepository } from 'workspace/game/domain/game.repository';

export async function selectUpgrade(ns: NS): Promise<WseUpgrade | undefined> {
    return getAllUpgrades(ns)
        .filter(upgrade => !upgrade.isPurchased())
        .shift();
}

/**
 * 
 * @remarks Ram cost : 0.1 GB
 * 
 * @param ns 
 * @returns 
 */
function getAllUpgrades(ns: NS): WseUpgrade[] {
    const gameRepository: GameRepository = new GameRepository(ns);
    return [
        {
            name: 'WSE account', 
            isPurchased: () => gameRepository.getData().hasWSEAccount, 
            cost: ns.stock.getConstants().WSEAccountCost, 
            purchase: '/workspace/resource-generator/stock-market/purchase-wse-account.worker.ts'
        },
        {
            name: 'TIX API',
            isPurchased: () => gameRepository.getData().hasTIXAPIAccess, 
            cost: ns.stock.getConstants().TIXAPICost, 
            purchase: '/workspace/resource-generator/stock-market/purchase-tix-api.worker.ts'
        },
        {
            name: '4S data TIX API',
            isPurchased: () => gameRepository.getData().has4SDataTIXAPI, 
            cost: ns.stock.getConstants().MarketDataTixApi4SCost, 
            purchase: '/workspace/resource-generator/stock-market/purchase-4s-market-data-tix-api.worker.ts'
        }
    ]

}