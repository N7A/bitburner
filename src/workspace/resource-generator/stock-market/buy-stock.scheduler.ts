import { getMaxShares, selectBestBuyQuick, waitBuyTime, waitRepayTime } from "workspace/resource-generator/stock-market/buy-stock.selector";
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service'

export async function main(ns: NS) {
    ns.ui.openTail();
    ns.disableLog('sleep');

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
    const buyPrice = ns.stock.buyStock(stockSymbol, shares);
    const spent = buyPrice * shares;
    ns.print(`Buy ${ns.formatNumber(shares)} ${stockSymbol} 
        for \$${ns.formatNumber(spent)} 
        (\$${ns.formatNumber(buyPrice)})`);

    const sharesLong = ns.stock.getPosition(stockSymbol)[0];
    const buyPriceLong = ns.stock.getPosition(stockSymbol)[1]
    const askPriceWaiting = (buyPriceLong*sharesLong + 2*ns.stock.getConstants().StockMarketCommission) / sharesLong;
    // TODO : split script buy / sell -> multi buy possible avant sell
    ns.print(`Wait repay time (\$${ns.formatNumber(askPriceWaiting)})...`);
    await waitRepayTime(ns, stockSymbol, spent);

    const sellPrice = ns.stock.sellStock(stockSymbol, sharesLong);
    const gain = sellPrice * sharesLong;
    ns.print(`Sell ${ns.formatNumber(sharesLong)} ${stockSymbol} for \$${ns.formatNumber(sellPrice)}`);
    ns.print(`Profit : \$${ns.formatNumber(gain - spent)}`);
}