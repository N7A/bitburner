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
                ns.enums.CodingContractName.AlgorithmicStockTraderIII
            ]
        );
    }

    protected getSolution(codingContract: CodingContractObject) {
        if (codingContract.type === this.ns.enums.CodingContractName.AlgorithmicStockTraderI) {
            return this.getSolutionI(codingContract);
        } else if (codingContract.type === this.ns.enums.CodingContractName.AlgorithmicStockTraderIII) {
            return this.getSolutionIII(codingContract);
        }

        this.logger.err(`Type (${codingContract}) non pris en charge`);
    }

    /**
     * Description : You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i: 164,141,153,24
     *
     * Determine the maximum possible profit you can earn using at most one transaction (i.e. you can only buy and sell the stock once). If no profit can be made then the answer should be 0. Note that you have to buy the stock before you can sell it.
     */
    private getSolutionI(contract: CodingContractObject): number {
        const data: number[] = contract.data as number[];
        this.logger.trace(Log.INFO('Données', data));
        
        let bestProfit: number = 0;
        const transaction1 = this.getBestTransaction(data);
        if (!transaction1) {
            return 0;
        }
        bestProfit = this.getProfit(data, transaction1);
        if (bestProfit > 0) {
            this.logger.trace(Log.INFO("Transaction 1", transaction1));
        }
            
        return Math.max(bestProfit, 0);
    }

    /**
     * Description : You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i: 48,150,88,145,103
     *
     * Determine the maximum possible profit you can earn using at most two transactions. A transaction is defined as buying and then selling one share of the stock. Note that you cannot engage in multiple transactions at once. In other words, you must sell the stock before you buy it again.
     *
     * If no profit can be made, then the answer should be 0.
     */
    private getSolutionIII(contract: CodingContractObject): number {
        const data: number[] = contract.data as number[];
        this.logger.trace(Log.INFO('Données', data));
        
        // TODO gerer cas ou 1 transaction est meilleur que 2 (une des transactions est négative)
        const minimalTransactionSize = 2;
        let bestProfit: number = 0;
        for (let i=minimalTransactionSize; i < data.length - (minimalTransactionSize-1); i++) {
            let transactions: Transaction[] = [];
            const transaction1 = this.getBestTransaction(data.slice(0, i));
            if (transaction1 && this.getProfit(data, transaction1) > 0) {
                transactions.push(transaction1);
            }

            const nextTransactionStartDay = transaction1 ? transaction1?.sellDay+1 : i;
            const transaction2 = this.getBestTransaction(data.slice(nextTransactionStartDay));
            if (transaction2 && this.getProfit(data.slice(nextTransactionStartDay), transaction2) > 0) {
                // conversion du jour depuis le slice vers le stockPrices actuel
                transaction2.buyDay += nextTransactionStartDay
                transaction2.sellDay += nextTransactionStartDay
                transactions.push(transaction2);
            }

            let profit = transactions.map(x => this.getProfit(data, x)).reduce((x,y) => x + y);
            if (profit > bestProfit) {
                this.logger.trace(Log.INFO("Transaction 1", transaction1));
                this.logger.trace(Log.INFO("Transaction 2", transaction2));
                bestProfit = profit
            }
        }
            
        return Math.max(bestProfit, 0);
    }

    private getBestTransaction(stockPrices: number[]): Transaction|undefined {
        let bestTransaction = undefined;

        // transaction impossible
        if (stockPrices.length < 2) {
            return bestTransaction;
        }

        const minPriceDay = stockPrices.findIndex(x => x == Math.min(...stockPrices));
        const maxPriceDay = stockPrices.findIndex(x => x == Math.max(...stockPrices));

        if(minPriceDay > maxPriceDay) {
            const transaction1: Transaction|undefined = this.getBestTransaction(stockPrices.slice(0, maxPriceDay+1));

            const transaction2: Transaction|undefined = this.getBestTransaction(stockPrices.slice(maxPriceDay+1, minPriceDay));
            if (transaction2) {
                // conversion du jour depuis le slice vers le stockPrices actuel
                transaction2.buyDay += maxPriceDay+1;
                transaction2.sellDay += maxPriceDay+1;
            }

            const transaction3: Transaction|undefined = this.getBestTransaction(stockPrices.slice(minPriceDay));
            if (transaction3) {
                // conversion du jour depuis le slice vers le stockPrices actuel
                transaction3.buyDay += minPriceDay;
                transaction3.sellDay += minPriceDay;
            }

            const possibleTransactions: Transaction[] = [transaction1, transaction2, transaction3]
                .filter(x => x !== undefined)
                .map(x => x as Transaction);
                
            return possibleTransactions.find(x => this.getProfit(stockPrices, x) === Math.max(...possibleTransactions.map(x => this.getProfit(stockPrices, x))));
        }

        return {
                buyDay: minPriceDay,
                sellDay: maxPriceDay
            }
    }

    private getProfit(stockPrices: number[], transaction: Transaction) {
        return stockPrices[transaction.sellDay] - stockPrices[transaction.buyDay];
    }

}
