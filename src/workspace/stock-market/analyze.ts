/**
 * Needs : 
 *  - World Stock Exchange (WSE)
 *  - Trade Information eXchange (TIX) API
 */
export async function main(ns: NS) {
    const symbols = ns.stock.getSymbols();
    for(const stockSymbol of symbols) {
        ns.print('Symbol : ', stockSymbol);
        ns.print('Demande : ', ns.formatNumber(ns.stock.getAskPrice(stockSymbol)));
        ns.print('Offre : ', ns.formatNumber(ns.stock.getBidPrice(stockSymbol)));
        ns.print('Prix : ', ns.formatNumber(ns.stock.getPrice(stockSymbol)));
        ns.print('Forecast : ', ns.formatPercent(ns.stock.getForecast(stockSymbol)))
        ns.print('Volatility : ', ns.formatPercent(ns.stock.getVolatility(stockSymbol)))
    }
}