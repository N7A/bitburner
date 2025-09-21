import {Transaction} from 'workspace/resource-generator/coding-contract/model/Transaction';
import { CodingContractResolver } from 'workspace/socle/interface/coding-contract-resolver';
import * as Log from 'workspace/socle/utils/logging';

export async function main(ns: NS) {
    const resolver: AlgorithmicStockTraderResolver = new AlgorithmicStockTraderResolver(ns);
    
    await resolver.run();
}

class AlgorithmicStockTraderResolver extends CodingContractResolver {
    constructor(ns: NS) {
        super(
            ns, 
            [
                ns.enums.CodingContractName.AlgorithmicStockTraderI,
                ns.enums.CodingContractName.AlgorithmicStockTraderII,
                ns.enums.CodingContractName.AlgorithmicStockTraderIII,
                ns.enums.CodingContractName.AlgorithmicStockTraderIV
            ]
        );
    }

    protected getSolution(codingContract: CodingContractObject) {
        if (codingContract.type === this.ns.enums.CodingContractName.AlgorithmicStockTraderI) {
            return this.getSolutionI(codingContract);
        } else if (codingContract.type === this.ns.enums.CodingContractName.AlgorithmicStockTraderII) {
            return this.getSolutionII(codingContract);
        } else if (codingContract.type === this.ns.enums.CodingContractName.AlgorithmicStockTraderIII) {
            return this.getSolutionIII(codingContract);
        } else if (codingContract.type === this.ns.enums.CodingContractName.AlgorithmicStockTraderIV) {
            return this.getSolutionIV(codingContract);
        }

        this.logger.err(`Type (${codingContract}) non pris en charge`);
    }

    /**
     * Description : You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i: 164,141,153,24
     *
     * Determine the maximum possible profit you can earn using at most one transaction (i.e. you can only buy and sell the stock once). 
     * If no profit can be made then the answer should be 0. Note that you have to buy the stock before you can sell it.
     */
    private getSolutionI(contract: CodingContractObject): number {
        const data: number[] = contract.data as number[];
        this.logger.trace(Log.INFO('Données', data));
        
        let transactions: Transaction[] = this.getBestTransactions(data, 1);

        return transactions.map(x => this.getProfit(data, x)).reduce((x,y) => x + y);
    }

    /**
     * Description : You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i:
     * 66,134,170,95,139,127,34,26,106,148,149,185,178,134,111,106,84,95,186,105,87,21,136,149,196,139,136,11,25
     * 
     * Determine the maximum possible profit you can earn using as many transactions as you'd like. 
     * A transaction is defined as buying and then selling one share of the stock. 
     * Note that you cannot engage in multiple transactions at once. 
     * In other words, you must sell the stock before you buy it again.
     * 
     * If no profit can be made, then the answer should be 0.
     */
    private getSolutionII(contract: CodingContractObject): number {
        const data: number[] = contract.data as number[];
        this.logger.trace(Log.INFO('Données', data));
        
        let transactions: Transaction[] = this.getBestTransactions(data);

        return transactions.map(x => this.getProfit(data, x)).reduce((x,y) => x + y);
    }

    /**
     * Description : You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i: 48,150,88,145,103
     *
     * Determine the maximum possible profit you can earn using at most two transactions. 
     * A transaction is defined as buying and then selling one share of the stock. 
     * Note that you cannot engage in multiple transactions at once. 
     * In other words, you must sell the stock before you buy it again.
     *
     * If no profit can be made, then the answer should be 0.
     */
    private getSolutionIII(contract: CodingContractObject): number {
        const data: number[] = contract.data as number[];
        this.logger.trace(Log.INFO('Données', data));
        
        let transactions: Transaction[] = this.getBestTransactions(data, 2);

        return transactions.map(x => this.getProfit(data, x)).reduce((x,y) => x + y);
    }

    /**
     * Description : You are given the following array with two elements: [4, [34,8,5,164,35,66,26,12,17,143,198,199,58,97,8,48,148,194]]
     * 
     * The first element is an integer k. 
     * The second element is an array of stock prices (which are numbers) where the i-th element represents the stock price on day i.
     * 
     * Determine the maximum possible profit you can earn using at most k transactions. 
     * A transaction is defined as buying and then selling one share of the stock. 
     * Note that you cannot engage in multiple transactions at once. 
     * In other words, you must sell the stock before you can buy it again.
     * 
     * If no profit can be made, then the answer should be 0.
     */
    private getSolutionIV(contract: CodingContractObject): number {
        const [maximalTransactionNumber, data]: [number, number[]] = contract.data as [number, number[]];
        this.logger.trace(Log.INFO('Données', data));
        
        let transactions: Transaction[] = this.getBestTransactions(data, maximalTransactionNumber);

        return transactions.map(x => this.getProfit(data, x)).reduce((x,y) => x + y);
    }

    private getBestTransactions(stockPrices: number[], maximalTransactionNumber?: number): Transaction[] {
        let transactions: Transaction[] = this.getAllTransactions(stockPrices);

        while(maximalTransactionNumber !== undefined && transactions.length > maximalTransactionNumber) {
            // remove least profit transaction
            const removedTransaction = transactions
                .sort((a,b) => this.getProfit(stockPrices, a) - this.getProfit(stockPrices, b))
                .shift();
            
            // find fusion via buy
            const buyFusion = transactions
                .filter(x => removedTransaction.buyDay < x.buyDay)
                .sort((a,b) => a.buyDay - b.buyDay)
                .shift();
            let gainBuyFusion: number = 0;
            if (buyFusion !== undefined) {
                gainBuyFusion = stockPrices[buyFusion.buyDay] - stockPrices[removedTransaction.buyDay]
            }
                
            // find fusion via sell
            const sellFusion = transactions
                .filter(x => x.sellDay < removedTransaction.sellDay)
                .sort((a,b) => a.sellDay - b.sellDay)
                .pop();
            let gainSellFusion: number = 0;
            if (sellFusion !== undefined) {
                gainSellFusion = stockPrices[removedTransaction.sellDay] - stockPrices[sellFusion.sellDay]
            }

            // to best fusion
            if (gainBuyFusion > gainSellFusion && gainBuyFusion > 0) {
                const index = transactions.indexOf(buyFusion);
                buyFusion.buyDay = removedTransaction.buyDay;
                transactions.splice(index, 1, buyFusion);
            } else if (gainSellFusion > gainBuyFusion && gainSellFusion > 0) {
                const index = transactions.indexOf(sellFusion);
                sellFusion.sellDay = removedTransaction.sellDay;
                transactions.splice(index, 1, sellFusion);
            }
        }
        
        return transactions;
    }

    private getAllTransactions(stockPrices: number[]) {
        let transaction: Transaction;
        let transactions: Transaction[] = [];

        let today: number = 0;
        do {
            const currentSlice = stockPrices.slice(today);
            transaction = this.getGoodTransaction(currentSlice);
            if (transaction === undefined) {
                break;
            }

            transaction = {buyDay: transaction.buyDay + today, sellDay: transaction.sellDay + today}
            this.logger.trace(Log.INFO("Transaction", JSON.stringify(transaction)));
            transactions.push(transaction);
            today = transaction.sellDay+1;
        } while(today < stockPrices.length)

        return transactions;
    }

    private getGoodTransaction(stockPrices: number[]): Transaction|undefined {
        // transaction impossible
        if (stockPrices.length < 2) {
            return undefined;
        }
        
        // seek for the best buy day
        let buyDay: number = 0;
        let sellDay: number;
        for (let nextDay=1; nextDay < stockPrices.length; nextDay++) {
            if (stockPrices[buyDay] <= stockPrices[nextDay]) {
                sellDay = nextDay
                break;
            }
            
            buyDay = nextDay
        }
        
        // transaction impossible
        if (sellDay === undefined) {
            return undefined;
        }

        // seek for the best sell day
        for (let nextDay=sellDay+1; nextDay < stockPrices.length; nextDay++) {
            if (stockPrices[sellDay] > stockPrices[nextDay]) {
                break;
            }
            
            sellDay = nextDay
        }

        return {
            buyDay: buyDay,
            sellDay: sellDay
        };
    }

    private getProfit(stockPrices: number[], transaction: Transaction) {
        return stockPrices[transaction.sellDay] - stockPrices[transaction.buyDay];
    }

}
