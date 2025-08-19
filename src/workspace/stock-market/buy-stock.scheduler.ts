import { selectBestBuyQuick, waitBuyTime, waitRepayTime } from "workspace/stock-market/buy-stock.selector";

export async function main(ns: NS) {
    const stockSymbol = selectBestBuyQuick(ns);
    await waitBuyTime(ns, stockSymbol);

    const shares = 1;
    const buyPrice = ns.stock.buyStock(stockSymbol, shares);

    // TODO : split script buy / sell -> multi buy possible avant sell
    await waitRepayTime(ns, stockSymbol, buyPrice * shares);

    const sellPrice = ns.stock.sellStock(stockSymbol, shares);
}