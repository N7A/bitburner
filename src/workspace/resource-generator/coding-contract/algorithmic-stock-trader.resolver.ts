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
        
        let bestProfit: number = 0;
        let transaction: Transaction;

        do {
            transaction = this.getGoodTransaction(data.slice(transaction.sellDay+1));
            if (transaction !== undefined) {
                break;
            }

            this.logger.trace(Log.INFO("Transaction", JSON.stringify(transaction)));
            bestProfit += this.getProfit(data, transaction);
        } while(transaction.sellDay+1 < data.length) 
        
        return bestProfit;
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
        
        // TODO gerer cas ou 1 transaction est meilleur que 2 (exemple une des transactions est négative)
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
        
        let bestProfit: number = 0;
        for (let i=0; i < maximalTransactionNumber; i++) {
            const transactions: Transaction[] = this.getBestTransactionV2(data, i);

            let profit = transactions.map(x => this.getProfit(data, x)).reduce((x,y) => x + y);
            if (profit > bestProfit) {
                bestProfit = profit
            } else {
                break;
            }
        }
            
        return Math.max(bestProfit, 0);
    }

    private getGoodTransaction(stockPrices: number[]): Transaction|undefined {
        let goodTransaction = undefined;

        // transaction impossible
        if (stockPrices.length < 2) {
            return goodTransaction;
        }
        
        // seek for buy day
        let buyDay = 0;
        for (let i=1; i < stockPrices.length; i++) {
            if (stockPrices[i] > stockPrices[buyDay]) {
                break;
            }
            
            buyDay = i
        }
        // seek for sell day
        for (let i=buyDay+1; i < stockPrices.length; i++) {
            const transaction = {
                buyDay: buyDay,
                sellDay: i
            };
            if (this.getProfit(stockPrices, transaction) > 0) {
                return transaction;
            }
        }

        return undefined;
    }

    private getBestTransactionV2(stockPrices: number[], maximalTransactionNumber: number): Transaction[] {
        let transactions: Transaction[] = [];

        let mostProfitTransaction: Transaction;
        do {
            const limitDays: LimitDays = this.getLimitDays(stockPrices, transactions);

            const transactionMin = this.getTransactionMin(stockPrices, transactions, limitDays.minPriceDays);
            const transactionMax = this.getTransactionMax(stockPrices, transactions, limitDays.maxPriceDays);

            mostProfitTransaction = [transactionMin, transactionMax]
                .filter(x => x !== undefined)
                .sort((a,b) => this.getProfit(stockPrices, a) - this.getProfit(stockPrices, b))
                .pop();

            if (mostProfitTransaction === undefined) {
                break;
            }
                
            transactions.push(mostProfitTransaction);
        } while(transactions.length < maximalTransactionNumber && mostProfitTransaction !== undefined)
        
        return transactions;
    }

    private getLimitDays(stockPrices: number[], transactions: Transaction[]): LimitDays {
        let minPrice: number = 0;
        let maxPrice: number = 0;
        for (let index = 0; index < stockPrices.length; index++) {
            const element = stockPrices[index];
            if (transactions.some(transaction => this.isTransactionInclude(transaction, index))) {
                continue;
            }

            if (element < minPrice) {
                minPrice = element;
            }
            if (element > maxPrice) {
                maxPrice = element;
            }
        }

        return {
            minPriceDays: stockPrices.map((value: number, index: number) => index)
            .filter(index => stockPrices[index] === minPrice),
            maxPriceDays: stockPrices.map((value: number, index: number) => index)
            .filter(index => stockPrices[index] === maxPrice)
        }
    }

    private getTransactionMin(stockPrices: number[], transactions: Transaction[], minPriceDays: number[]): Transaction|undefined {
        const startDay: number = Math.min(...minPriceDays);
        const transactionAfterStartDay = transactions.map(x => x.buyDay)
                // after startDay
                .filter(day => startDay < day);
        const endDay: number = transactionAfterStartDay.length <= 0 ? Math.min(...transactionAfterStartDay) : stockPrices.length - 1;

        // aucune transaction possible
        if (startDay === endDay) {
            return undefined;
        }

        // recherche du meilleur jour pour vendre
        const sellDay: number = stockPrices
            // get days
            .map((value: number, index: number) => index)
            // limit zone
            .slice(startDay, endDay)
            // get if profit
            .filter(day => stockPrices[startDay] < stockPrices[day])
            // find max price
            .sort((a, b) => stockPrices[a] - stockPrices[b])
            .pop();

        // aucun jour pour vendre trouvé
        if (sellDay === undefined) {
            return undefined;
        }

        return {
            // least distance with sellDay
            buyDay: Math.max(
                ...minPriceDays
                    // before sellDay
                    .filter(day => day < sellDay)
            ),
            sellDay: sellDay
        }
    }

    private getTransactionMax(stockPrices: number[], transactions: Transaction[], maxPriceDays: number[]): Transaction|undefined {
        const endDay: number = Math.max(...maxPriceDays);
        const transactionBeforeEndDay = transactions.map(x => x.sellDay)
                // before endDay
                .filter(day => day < endDay);
        const startDay: number = transactionBeforeEndDay.length <= 0 ? Math.max(...transactionBeforeEndDay) : 0;

        // aucune transaction possible
        if (startDay === endDay) {
            return undefined;
        }

        // recherche du meilleur jour pour acheter
        const buyDay: number = stockPrices
            // get days
            .map((value: number, index: number) => index)
            // limit zone
            .slice(startDay, endDay)
            // get if profit
            .filter(day => stockPrices[day] < stockPrices[endDay])
            // find min price
            .sort((a, b) => stockPrices[a] - stockPrices[b])
            .shift();

        // aucun jour pour acheter trouvé
        if (buyDay === undefined) {
            return undefined;
        }

        return {
            buyDay: buyDay,
            // least distance with buyDay
            sellDay: Math.min(
                ...maxPriceDays
                    // after buyDay
                    .filter(day => buyDay < day)
            )
        }
    }

    private isTransactionInclude(transaction: Transaction, day: number) {
        return transaction.buyDay <= day && day <= transaction.sellDay;
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

type LimitDays = {
    minPriceDays: number[],
    maxPriceDays: number[]
}