export function selectBestBuyQuick(ns: NS) {
    return ns.stock.getSymbols()
        // la plus haute augmentation de prix en dernier
        .sort((a: string, b: string) => ns.stock.getVolatility(a) - ns.stock.getVolatility(b))
        .pop();
}

/**
 * 
 * Needs : 
 *  - 4S Market Data TIX API
 * @param ns 
 * @returns 
 */
export function selectBestTrainEnMarche(ns: NS) {
    return ns.stock.getSymbols()
        .filter(x => ns.stock.getForecast(x) > 50)
        // la plus haute chance d'augmenter en premier
        .sort((a: string, b: string) => ns.stock.getForecast(b) - ns.stock.getForecast(a))
        // top 5
        .slice(0, 4)
        // la plus haute augmentation de prix en dernier
        .sort((a: string, b: string) => ns.stock.getVolatility(a) - ns.stock.getVolatility(b))
        .pop();
}

export async function waitBuyTime(ns: NS, stockSymbol: string) {
    // wait stop increase
    await waitStopIncrease(ns, stockSymbol);

    // wait stop decrease
    await waitStopDecrease(ns, stockSymbol);
}

export function getMaxShares(ns: NS, stockSymbol: string, maxMoneyToSpend: number) {
    return Math.min(
        ns.stock.getMaxShares(stockSymbol),
        (maxMoneyToSpend - ns.stock.getConstants().StockMarketCommission) / ns.stock.getBidPrice(stockSymbol)
    );
}

export async function waitRepayTime(ns: NS, stockSymbol: string, moneySpent: number) {
    while(
        ns.stock.getAskPrice(stockSymbol) - ns.stock.getConstants().StockMarketCommission 
        < moneySpent + ns.stock.getConstants().StockMarketCommission
    ) {
        await waitSellTime(ns, stockSymbol);
    }
}

async function waitSellTime(ns: NS, stockSymbol: string) {
    // wait stop decrease
    await waitStopDecrease(ns, stockSymbol);

    // wait stop increase
    await waitStopIncrease(ns, stockSymbol);
}

async function waitStopDecrease(ns: NS, stockSymbol: string) {
    while(ns.stock.getForecast(stockSymbol) < 0.5) {
        await ns.sleep(ns.stock.getConstants().msPerStockUpdate)
    }
}

async function waitStopIncrease(ns: NS, stockSymbol: string) {
    while(ns.stock.getForecast(stockSymbol) > 0.5) {
        await ns.sleep(ns.stock.getConstants().msPerStockUpdate)
    }
}