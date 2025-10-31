import { Headhunter } from 'workspace/socle/interface/headhunter';
import { getMaxShares, selectBestBuyQuick, waitBuyTime } from "workspace/resource-generator/stock-market/buy-stock.selector";
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service'
import * as Log from 'workspace/socle/utils/logging';
import { Logger } from 'workspace/socle/Logger';
import { SellStockWorker } from "cmd/resource-generator/stock-market/sell-stock.worker";
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { DaemonFlags } from 'workspace/common/model/DaemonFlags';

//#region Constantes
const FLAGS_SCHEMA: [string, string | number | boolean | string[]][] = [
    [DaemonFlags.oneshot, false]
];
//#endregion Constantes

/**
 * 
 * @param ns 
 * @requires 4S Market Data TIX API Access
 */
export async function main(ns: NS) {
    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);
    const main: Main = new Main(ns);

    if (scriptFlags[DaemonFlags.oneshot]) {
        main.killAfterLoop();
    }
    
    await main.run();
}

class Main extends Headhunter<string> {
    private dashboard: Dashboard;
    private stockSymbol: string;

    constructor(ns: NS) {
        // waitNewTargets = true : contracts appear over the time
        super(ns, true)
        this.logger = new Logger(ns);
        this.dashboard = new Dashboard(ns, 'Buy max volatility stock', {icon: '📉💲', role: 'scheduler'});
        this.setupDashboard();
    }

    // TODO : save current state pour reprendre le travail apès avoir quitté le jeu
    protected async work(targets: string[]): Promise<any> {
        this.logger.log(`🪙 Start`);
        const workStartTime = new Date();
        await this.getTargets();
        this.logger.log(`Best to buy : ${Log.target(this.stockSymbol)}`);
        // TODO : multi buy possible avant sell
        await this.buy();
        const sellWorker: SellStockWorker = new SellStockWorker(this.ns, {stockSymbol: this.stockSymbol});
        const profit = await sellWorker.sell();
        const workEndTime = new Date();
        const workDuration = new Date(workEndTime.getTime() - workStartTime.getTime());
        this.logger.log(Log.INFO("Time to profit",  Log.duration(workDuration)));
        this.logger.log(Log.INFO("Production", `${Log.money(this.ns, profit / workDuration.getTime()*1000)} / s`));
        this.logger.log(`🪙 End`);
    }

    async getTargets(): Promise<string[]> {
        const moneyPiggyBankService = new MoneyPiggyBankService(this.ns);

        let shares: number = 0;
        let potentialTarget: string | undefined;
        do {
            potentialTarget = selectBestBuyQuick(this.ns);
            if (!potentialTarget) {
                this.logger.warn('Aucune cible trouvée')
                await this.ns.asleep(500);
                continue;
            }

            this.logger.log(`Potential target : ${potentialTarget}`);
            
            this.logger.waiting('buy time');
            await waitBuyTime(this.ns, potentialTarget);
            this.logger.stopWaiting();

            const availableMoney = Math.min(1000*1000*1000, moneyPiggyBankService.getDisponibleMoney(this.ns.getPlayer().money));
            shares = getMaxShares(this.ns, potentialTarget, availableMoney);
        } while(shares === 0)

        this.stockSymbol = potentialTarget ?? ''
        return [this.stockSymbol]
    }
    
    async buy(): Promise<string> {
        const moneyPiggyBankService = new MoneyPiggyBankService(this.ns);

        const availableMoney = Math.min(1000*1000*1000, moneyPiggyBankService.getDisponibleMoney(this.ns.getPlayer().money));
        const shares: number = getMaxShares(this.ns, this.stockSymbol, availableMoney);
        
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
        
        this.dashboard.initTailTitle();
        
        this.ns.ui.openTail();
    
        const ligneNumber = 10;
        this.ns.ui.resizeTail(500, Math.min(ligneNumber * 25, 600));
    }
    //#endregion Dashboard
}