import { Headhunter } from 'workspace/common/headhunter';
import { getMaxShares, selectBestTrainEnMarche } from "workspace/resource-generator/stock-market/buy-stock.selector";
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service'
import * as Log from 'workspace/frameworks/logging';
import { Logger } from 'workspace/common/Logger';
import { SellStockWorker } from "workspace/resource-generator/stock-market/sell-stock.worker";

export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);
    const main: Main = new Main(ns);

    // waitNewTargets = true : contracts appear over the time
    const daemon = new Headhunter<string>(ns, () => main.getTargets(), main.run, true);
    
    if (!input.runHasLoop) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();
}

//#region Input arguments
type InputArg = {
	/** Serveur cible */
	runHasLoop: boolean;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
	return {
		runHasLoop: ns.args[0] ? (ns.args[0] as boolean) : false
	};
}
//#endregion Input arguments

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
        await this.getTargets();
        this.logger.log(`Best to buy : ${Log.target(this.stockSymbol)}`);
        await this.buy();
        const sellWorker: SellStockWorker = new SellStockWorker(this.ns, {stockSymbol: this.stockSymbol});
        const profit = await sellWorker.sell();
        const workEndTime = new Date();
        const workDuration = new Date(workEndTime.getTime() - workStartTime.getTime());
        this.logger.log(Log.INFO("Time to profit",  Log.time(workDuration)));
        this.logger.log(Log.INFO("Production", `${Log.money(this.ns, profit / workDuration.getTime()*1000)} / s`));
        this.logger.log(`End`);
    }

    async getTargets(): Promise<string[]> {
        const moneyPiggyBankService = new MoneyPiggyBankService(this.ns);

        let shares: number = 0;
        do {
            this.stockSymbol = selectBestTrainEnMarche(this.ns);
            if (!this.stockSymbol) {
                this.logger.warn('Aucune cible trouvée')
                await this.ns.asleep(500);
                continue;
            }

            const availableMoney = Math.min(1000*1000*1000, moneyPiggyBankService.getDisponibleMoney(this.ns.getPlayer().money));
            shares = getMaxShares(this.ns, this.stockSymbol, availableMoney);
        } while(shares === 0)

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
        
        Log.initTailTitle(this.ns, 'Buy max forecast stock', 'scheduler');
        
        this.ns.ui.openTail();
        
        const ligneNumber = 10;
        this.ns.ui.resizeTail(500, Math.min(ligneNumber * 25, 600));
    }
    //#endregion Dashboard
}