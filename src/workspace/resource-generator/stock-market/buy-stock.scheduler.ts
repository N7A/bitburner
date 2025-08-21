import { getMaxShares, selectBestBuyQuick, waitBuyTime, waitRepayTime } from "workspace/resource-generator/stock-market/buy-stock.selector";
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service'

export async function main(ns: NS) {
    const moneyPiggyBankService = new MoneyPiggyBankService(ns);

    const stockSymbol = selectBestBuyQuick(ns);
    await waitBuyTime(ns, stockSymbol);

    const availableMoney = moneyPiggyBankService.getDisponibleMoney(ns.getPlayer().money);
    const shares = getMaxShares(ns, stockSymbol, availableMoney);
    const buyPrice = ns.stock.buyStock(stockSymbol, shares);

    // TODO : split script buy / sell -> multi buy possible avant sell
    await waitRepayTime(ns, stockSymbol, buyPrice * shares);

    const sellPrice = ns.stock.sellStock(stockSymbol, shares);
}