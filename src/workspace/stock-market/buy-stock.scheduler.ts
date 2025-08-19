import { getMaxShares, selectBestBuyQuick, waitBuyTime, waitRepayTime } from "workspace/stock-market/buy-stock.selector";
import {Money as MoneyPiggyBank} from 'workspace/piggy-bank/piggy-bank.service'

export async function main(ns: NS) {
    const stockSymbol = selectBestBuyQuick(ns);
    await waitBuyTime(ns, stockSymbol);

    const availableMoney = MoneyPiggyBank.getDisponibleMoney(ns, ns.getPlayer().money);
    const shares = getMaxShares(ns, stockSymbol, availableMoney);
    const buyPrice = ns.stock.buyStock(stockSymbol, shares);

    // TODO : split script buy / sell -> multi buy possible avant sell
    await waitRepayTime(ns, stockSymbol, buyPrice * shares);

    const sellPrice = ns.stock.sellStock(stockSymbol, shares);
}