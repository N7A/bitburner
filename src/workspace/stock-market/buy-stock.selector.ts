export function selectBestBuyQuick(ns: NS) {
    return ns.stock.getSymbols()
        .sort((a: string, b: string) => ns.stock.getVolatility(a) - ns.stock.getVolatility(b))
        .pop();
}

export function selectBestBuyLong(ns: NS) {
    return ns.stock.getSymbols()
        .sort((a: string, b: string) => ns.stock.getVolatility(a) - ns.stock.getVolatility(b))
        .shift();
}

export async function waitBuyTime(ns: NS, stockSymbol: string) {
    // wait stop increase
    await waitStopIncrease(ns, stockSymbol);

    // wait stop decrease
    await waitStopDecrease(ns, stockSymbol);
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