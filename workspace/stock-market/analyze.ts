/**
 * Needs : 
 *  - World Stock Exchange (WSE)
 *  - Trade Information eXchange (TIX) API
 */
export async function main(ns: NS) {
    const symbols = ns.stock.getSymbols()
    for(const stockSymbol of symbols) {
        ns.print('Forecast : ', ns.stock.getForecast(stockSymbol))
        ns.print('Volatility : ', ns.stock.getVolatility(stockSymbol))
    }
}