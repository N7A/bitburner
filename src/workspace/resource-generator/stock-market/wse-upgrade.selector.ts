import { WseUpgrade } from 'workspace/resource-generator/stock-market/model/WseUpgrade'

export async function selectUpgrade(ns: NS): Promise<WseUpgrade | null> {
    const upgrades: WseUpgrade[] = getAllUpgrades(ns);

    for(const upgrade of upgrades) {
        if(!upgrade.isPurchased()) {
            return upgrade;
        }
    }
    
    return null;
}

// TODO : extract purchase on script run to reduice ram
function getAllUpgrades(ns: NS): WseUpgrade[] {
    return [
        {
            name: 'WSE account', 
            isPurchased: ns.stock.hasWSEAccount, 
            cost: ns.stock.getConstants().WSEAccountCost, 
            purchase: '/workspace/resource-generator/stock-market/purchase-wse-account.worker.ts'
        },
        {
            name: 'TIX API',
            isPurchased: ns.stock.hasTIXAPIAccess, 
            cost: ns.stock.getConstants().TIXAPICost, 
            purchase: '/workspace/resource-generator/stock-market/purchase-tix-api.worker.ts'
        },
        {
            name: '4S data',
            isPurchased: ns.stock.has4SData, 
            cost: ns.stock.getConstants().MarketData4SCost, 
            purchase: '/workspace/resource-generator/stock-market/purchase-4s-market-data.worker.ts'
        },
        {
            name: '4S data TIX API',
            isPurchased: ns.stock.has4SDataTIXAPI, 
            cost: ns.stock.getConstants().MarketDataTixApi4SCost, 
            purchase: '/workspace/resource-generator/stock-market/purchase-4s-market-data-tix-api.worker.ts'
        }
    ]

}