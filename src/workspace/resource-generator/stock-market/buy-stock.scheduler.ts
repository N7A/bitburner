import { getMaxShares, selectBestBuyQuick, waitBuyTime } from "workspace/resource-generator/stock-market/buy-stock.selector";
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service'
import * as Log from 'workspace/frameworks/logging';
import { Logger } from 'workspace/common/Logger';
import { SellStockWorker } from "workspace/resource-generator/stock-market/sell-stock.worker";

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
        // TODO : multi buy possible avant sell
        await this.buy();
        const sellWorker: SellStockWorker = new SellStockWorker(this.ns, {stockSymbol: this.stockSymbol});
        const profit = await sellWorker.sell();
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
            this.stockSymbol = selectBestBuyQuick(this.ns);
            if (!this.stockSymbol) {
                this.logger.warn('Aucune cible trouvée')
                await this.ns.asleep(500);
                continue;
            }
            this.logger.log(`Best to buy : ${Log.target(this.stockSymbol)}`);

            this.logger.waiting('buy time');
            await waitBuyTime(this.ns, this.stockSymbol);
            this.logger.stopWaiting();

            const availableMoney = Math.min(1000*1000*1000, moneyPiggyBankService.getDisponibleMoney(this.ns.getPlayer().money));
            shares = getMaxShares(this.ns, this.stockSymbol, availableMoney);
        } while(shares === 0)
        
        const buyPrice = this.ns.stock.buyStock(this.stockSymbol, shares);
        const spent = buyPrice * shares;
        this.logger.log(`Buy ${this.ns.formatNumber(shares)} ${this.stockSymbol} for ${Log.money(this.ns, spent)} (${Log.money(this.ns, buyPrice)})`);

        return this.stockSymbol;
    }

    //#region Dashboard
    private setupDashboard() {
        this.ns.disableLog('sleep');
        this.ns.disableLog('asleep');
        this.ns.clearLog();
        
        Log.initTailTitle(this.ns, 'Buy max volatility stock', 'scheduler');
        
        this.ns.ui.openTail();
    
        const ligneNumber = 10;
        this.ns.ui.resizeTail(500, Math.min(ligneNumber * 25, 600));
    }
    //#endregion Dashboard
}