import { getMaxShares, selectBestTrainEnMarche, waitRepayTime } from "workspace/resource-generator/stock-market/buy-stock.selector";
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service'
import * as Log from 'workspace/frameworks/logging';

export async function main(ns: NS) {
    ns.disableLog('sleep');
    ns.clearLog();
    ns.ui.openTail();

    const workStartTime = new Date();
    this.ns.print(`${Log.time(new Date(Date.now()))} - Start`)

    const moneyPiggyBankService = new MoneyPiggyBankService(ns);

    let shares: number = 0;
    let stockSymbol: string | undefined;
    do {
        stockSymbol = selectBestTrainEnMarche(ns);

        if (!stockSymbol) {
            return;
        }
        ns.print(`Best to buy : ${stockSymbol}`);

        const availableMoney = Math.min(1000*1000*1000, moneyPiggyBankService.getDisponibleMoney(ns.getPlayer().money));
        shares = getMaxShares(ns, stockSymbol, availableMoney);
    } while(shares === 0)
    
    const buyPrice = ns.stock.buyStock(stockSymbol, shares);
    const spent = buyPrice * shares;
    ns.print(`${Log.time(new Date(Date.now()))} - Buy ${ns.formatNumber(shares)} ${stockSymbol} for \$${ns.formatNumber(spent)} (\$${ns.formatNumber(buyPrice)})`);

    const sharesLong = ns.stock.getPosition(stockSymbol)[0];
    const buyPriceLong = ns.stock.getPosition(stockSymbol)[1]
    const askPriceWaiting = (buyPriceLong*sharesLong + 2*ns.stock.getConstants().StockMarketCommission) / sharesLong;
    // TODO : split script buy / sell -> multi buy possible avant sell
    ns.print(`${Log.time(new Date(Date.now()))} - Wait repay time (Ask Price: \$${ns.formatNumber(askPriceWaiting)})...`);
    await waitRepayTime(ns, stockSymbol, buyPriceLong*sharesLong, sharesLong);

    const sellPrice = ns.stock.sellStock(stockSymbol, sharesLong);
    const gain = sellPrice * sharesLong;
    ns.print(`${Log.time(new Date(Date.now()))} - Sell ${ns.formatNumber(sharesLong)} ${stockSymbol} for \$${ns.formatNumber(sellPrice)}`);
    ns.print(`Profit : \$${ns.formatNumber(gain - spent)}`);
    const workEndTime = new Date();
    const workDuration = new Date(workEndTime.getTime() - workStartTime.getTime());
    ns.print(Log.INFO("Time to profit",  Log.time(workDuration)));
    ns.print(Log.INFO("Production", `\$${ns.formatNumber((gain - spent) / workDuration.getTime()*1000)} / s`));
    ns.print(`${Log.time(new Date(Date.now()))} - End`);
}