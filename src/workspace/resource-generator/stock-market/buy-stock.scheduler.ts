import { getMaxShares, selectBestBuyQuick, waitBuyTime, waitRepayTime } from "workspace/resource-generator/stock-market/buy-stock.selector";
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service'

export async function main(ns: NS) {
    ns.ui.openTail();
    const moneyPiggyBankService = new MoneyPiggyBankService(ns);

    const stockSymbol = selectBestBuyQuick(ns);
    if (!stockSymbol) {
        return;
    }
    ns.print(`Best to buy : ${stockSymbol}`);

    ns.print('Wait buy time...');
    await waitBuyTime(ns, stockSymbol);

    const availableMoney = moneyPiggyBankService.getDisponibleMoney(ns.getPlayer().money);
    const shares = getMaxShares(ns, stockSymbol, availableMoney);
    ns.print(`Buy ${shares} ${stockSymbol}`);
    const buyPrice = ns.stock.buyStock(stockSymbol, shares);

    // TODO : split script buy / sell -> multi buy possible avant sell
    ns.print('Wait repay time...');
    await waitRepayTime(ns, stockSymbol, buyPrice * shares);

    ns.print(`Sell ${shares} ${stockSymbol}`);
    const sellPrice = ns.stock.sellStock(stockSymbol, shares);
}