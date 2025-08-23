import { getMaxShares, selectBestTrainEnMarche, waitRepayTime } from "workspace/resource-generator/stock-market/buy-stock.selector";
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service'
import * as Log from 'workspace/frameworks/logging';
import { Logger } from 'workspace/common/Logger';

export async function main(ns: NS) {
    const main: Main = new Main(ns);

    await main.run();
}

class Main {
    private ns: NS;
    private logger: Logger;
    private stockSymbol: string;

    constructor(ns: NS) {
        this.ns = ns;
        this.logger = new Logger(ns);
        this.setupDashboard();
    }

    async run() {
        this.logger.log(`Start`);
        const workStartTime = new Date();
        await this.buy();
        const profit = await this.sell();
        const workEndTime = new Date();
        const workDuration = new Date(workEndTime.getTime() - workStartTime.getTime());
        this.logger.log(Log.INFO("Time to profit",  Log.time(workDuration)));
        this.logger.log(Log.INFO("Production", `${Log.money(this.ns, profit / workDuration.getTime()*1000)} / s`));
        this.logger.log(`End`);
    }

    async buy(): Promise<string> {
        const moneyPiggyBankService = new MoneyPiggyBankService(this.ns);

        let shares: number = 0;
        do {
            this.stockSymbol = selectBestTrainEnMarche(this.ns);
            if (!this.stockSymbol) {
                return;
            }
            this.logger.log(`Best to buy : ${Log.target(this.stockSymbol)}`);

            const availableMoney = Math.min(1000*1000*1000, moneyPiggyBankService.getDisponibleMoney(this.ns.getPlayer().money));
            shares = getMaxShares(this.ns, this.stockSymbol, availableMoney);
        } while(shares === 0)
        
        const buyPrice = this.ns.stock.buyStock(this.stockSymbol, shares);
        const spent = buyPrice * shares;
        this.logger.log(`Buy ${this.ns.formatNumber(shares)} ${this.stockSymbol} for ${Log.money(this.ns, spent)} (${Log.money(this.ns, buyPrice)})`);

        return this.stockSymbol;
    }

    async sell(): Promise<number> {
        const sharesLong = this.ns.stock.getPosition(this.stockSymbol)[0];
        const buyPriceLong = this.ns.stock.getPosition(this.stockSymbol)[1]
        const spent = buyPriceLong*sharesLong + 2*this.ns.stock.getConstants().StockMarketCommission;
        const askPriceWaiting = spent / sharesLong;
        // TODO : split script buy / sell -> multi buy possible avant sell
        this.logger.waiting(`repay time (Ask Price: ${Log.money(this.ns, askPriceWaiting)})`);
        await waitRepayTime(this.ns, this.stockSymbol, buyPriceLong*sharesLong, sharesLong);
        this.logger.stopWaiting();

        const sellPrice = this.ns.stock.sellStock(this.stockSymbol, sharesLong);
        const gain = sellPrice * sharesLong;
        this.logger.log(`Sell ${this.ns.formatNumber(sharesLong)} ${this.stockSymbol} for ${Log.money(this.ns, sellPrice)}`);
        this.logger.log(`Profit : ${Log.money(this.ns, gain - spent)}`);
        return gain - spent
    }
    
    //#region Dashboard
    private setupDashboard() {
        this.ns.disableLog('sleep');
        this.ns.disableLog('asleep');
        this.ns.clearLog();
        
        Log.initTailTitle(this.ns, 'Buy max forecast stock', 'scheduler');
        
        this.ns.ui.openTail();
        
        const ligneNumber = 10;
        this.ns.ui.resizeTail(500, Math.min(ligneNumber * 25, 600));
    }
    //#endregion Dashboard
}