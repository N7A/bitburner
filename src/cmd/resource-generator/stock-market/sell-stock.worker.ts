import { waitRepayTime } from "workspace/resource-generator/stock-market/buy-stock.selector";
import * as Log from 'workspace/socle/utils/logging';
import { Logger } from 'workspace/socle/Logger';
import { Dashboard } from "workspace/socle/interface/dashboard";

export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);

    const main: SellStockWorker = new SellStockWorker(ns, input);
    main.setupDashboard();

    await main.run();
}

//#region Input arguments
type InputArg = {
    stockSymbol: string;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
    const logger = new Logger(ns);
    if (ns.args[0] === undefined) {
        logger.err('Merci de renseigner un stock symbol');
        ns.exit();
    }

    logger.trace(Log.title('Arguments'));
    logger.trace(ns.args?.toString());

    const input = {
        stockSymbol: (ns.args[0] as string)
    };
    
    logger.trace(Log.title('Données d\'entrée'));
    logger.trace(Log.object(input));
    return input;
}
//#endregion Input arguments

export class SellStockWorker {
    private ns: NS;
    private logger: Logger;
    private dashboard: Dashboard;
    private stockSymbol: string;

    constructor(ns: NS, input: InputArg) {
        this.ns = ns;
        this.logger = new Logger(ns);
        this.stockSymbol = input.stockSymbol;

        this.dashboard = new Dashboard(ns, `${Log.source(this.stockSymbol, {colorless: true})} Sell stock`, {icon: '📈💲', role: 'worker'});
    }

    async run() {
        this.logger.log(`Start`);
        const workStartTime = new Date();
        const profit = await this.sell();
        const workEndTime = new Date();
        const workDuration = new Date(workEndTime.getTime() - workStartTime.getTime());
        this.logger.log(Log.INFO("Time to profit",  Log.duration(workDuration)));
        this.logger.log(Log.INFO("Production", `${Log.money(this.ns, profit / workDuration.getTime()*1000)} / s`));
        this.logger.log(`End`);
    }

    async sell(): Promise<number> {
        const sharesLong = this.ns.stock.getPosition(this.stockSymbol)[0];
        const buyPriceLong = this.ns.stock.getPosition(this.stockSymbol)[1]
        const spent = buyPriceLong*sharesLong + 2*this.ns.stock.getConstants().StockMarketCommission;
        const askPriceWaiting = spent / sharesLong;
        this.logger.log(`repay time (Ask Price: ${Log.money(this.ns, askPriceWaiting)})...`);
        await waitRepayTime(this.ns, this.stockSymbol, buyPriceLong*sharesLong, sharesLong);
        this.logger.stopWaiting();

        const sellPrice = this.ns.stock.sellStock(this.stockSymbol, sharesLong);
        const gain = sellPrice * sharesLong;
        this.logger.log(`Sell ${this.ns.formatNumber(sharesLong)} ${this.stockSymbol} for ${Log.money(this.ns, sellPrice)}`);
        this.logger.log(`Profit : ${Log.money(this.ns, gain - spent)}`);
        return gain - spent
    }
    
    //#region Dashboard
    setupDashboard() {
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