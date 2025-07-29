import {Contract} from 'workspace/coding-contract/model/Contract';
import {Transaction} from 'workspace/coding-contract/model/Transaction';

export async function main(ns: NS) {

}

/**
 * Description : You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i: 164,141,153,24
 *
 * Determine the maximum possible profit you can earn using at most one transaction (i.e. you can only buy and sell the stock once). If no profit can be made then the answer should be 0. Note that you have to buy the stock before you can sell it.
 */
function getSolutionI(ns: NS, contract: Contract): number {
    // load input arguments
    const input: InputArg = getInput(ns, contract);

    const data: number[] = ns.codingcontract.getData(input.filepath, input.hostname);
    ns.print('Données : ' + data);
    
    let bestProfit: number = 0;
    const transaction1 = getBestTransaction(data);
    if (!transaction1) {
        return 0;
    }
    bestProfit = getProfit(transaction1);
    if (bestProfit > 0) {
        ns.print("Transaction 1 :", transaction1);
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
function getSolutionIII(ns: NS, contract: Contract): number {
    // load input arguments
    const input: InputArg = getInput(ns, contract);

    const data: number[] = ns.codingcontract.getData(input.filepath, input.hostname);
    ns.print('Données : ' + data);
    
    // TODO gerer cas ou 1 transaction est meilleur que 2 (une des transactions est négative)
    const minimalTransactionSize = 2;
    let bestProfit: number = 0;
    for (let i=minimalTransactionSize; i < data.length - (minimalTransactionSize-1); i++) {
        let transactions: Transaction[] = [];
        const transaction1 = getBestTransaction(data.slice(0, i));
        if (transaction1 && getProfit(transaction1) > 0) {
            transactions.push(transaction1);
        }

        const nextTransactionStartDay = transaction1 ? transaction1?.sellDay+1 : i;
        const transaction2 = getBestTransaction(data.slice(nextTransactionStartDay));
        if (transaction2 && getProfit(transaction2) > 0) {
            // conversion du jour depuis le slice vers le stockPrices actuel
            transaction2.buyDay += nextTransactionStartDay
            transaction2.sellDay += nextTransactionStartDay
            transactions.push(transaction2);
        }

        let profit = transactions.map(x => getProfit(x)).reduce((x,y) => x + y);
        if (profit > bestProfit) {
            ns.print("Transaction 1 :", transaction1);
            ns.print("Transaction 2 :", transaction2);
            bestProfit = profit
        }
    }
        
    return Math.max(bestProfit, 0);
}

function getBestTransaction(stockPrices: number[]): Transaction|undefined {
    let bestTransaction = undefined;

    // transaction impossible
    if (stockPrices.length < 2) {
        return bestTransaction;
    }

    const getProfit = (transaction: Transaction) => transaction.sellDay - transaction.buyDay;
    
    const minPriceDay = stockPrices.findIndex(x => x == Math.min(...stockPrices));
    const maxPriceDay = stockPrices.findIndex(x => x == Math.max(...stockPrices));

    if(minPriceDay > maxPriceDay) {
        const transaction1: Transaction|undefined = getBestTransaction(stockPrices.slice(0, maxPriceDay+1));

        const transaction2: Transaction|undefined = getBestTransaction(stockPrices.slice(maxPriceDay+1, minPriceDay));
        // conversion du jour depuis le slice vers le stockPrices actuel
        transaction2!.buyDay += maxPriceDay+1;
        transaction2!.sellDay += maxPriceDay+1;

        const transaction3: Transaction|undefined = getBestTransaction(stockPrices.slice(minPriceDay));
        // conversion du jour depuis le slice vers le stockPrices actuel
        transaction3!.buyDay += minPriceDay;
        transaction3!.sellDay += minPriceDay;

        const possibleTransactions: Transaction[] = [transaction1, transaction2, transaction3]
            .filter(x => x !== undefined)
            .map(x => x as Transaction);
            
        return possibleTransactions.find(x => getProfit(x) === Math.max(...possibleTransactions.map(x => getProfit(x))));
    }

    return {
            buyDay: minPriceDay,
            sellDay: maxPriceDay
        }
}

function getProfit(transaction: Transaction) {
    return transaction.sellDay - transaction.buyDay;
}

//#region Input arguments
type InputArg = {
    hostname: string;
    filepath: string;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS, contract: Contract): InputArg {
    let result: InputArg = {
        hostname: (ns.args[0] ?? contract?.hostname ?? ns.getHostname()) as string,
        filepath: (ns.args[1] ?? contract?.filepath) as string
    };

    return result;
}
//#endregion Input arguments
