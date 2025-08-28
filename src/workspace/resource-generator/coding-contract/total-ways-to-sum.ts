import {Contract} from 'workspace/resource-generator/coding-contract/model/Contract';
import {main as getContracts} from 'workspace/resource-generator/coding-contract/contract.selector';
import * as Log from 'workspace/socle/utils/logging';

export async function main(ns: NS) {
    // récupération des contrats concernés
    const contracts: Contract[] = (await getContracts(ns))
        .filter(x => [
            ns.enums.CodingContractName.TotalWaysToSum
        ].includes(ns.codingcontract.getContract(x.filepath, x.hostname).type));

        let solution: string[] = getSolution(ns, 6);
        ns.print(Log.INFO('Solution', solution));
    /*for(const contract of contracts) {
        ns.print(Log.INFO('Contrat', `${contract.hostname} > ${contract.filepath}`));
        // mise en forme des données d'entrée
        const data: number = ns.codingcontract.getData(contract.filepath, contract.hostname);
        ns.print('Données : ' + data);
        
        // recherche de la solution
        let solution: string[] = getSolution(ns, data);
        ns.print(Log.INFO('Solution', solution));*/

        // proposition la solution
        /*let reward = ns.codingcontract.attempt(solution, contract.filepath, contract.hostname);
        if (reward) {
            ns.tprint('SUCCESS', ' ', `Contract ${contract.hostname} > ${contract.filepath} [solved]`);
            ns.tprint('INFO', ' ', Log.INFO('Reward', reward));
        } else {
            ns.tprint('ERROR', ' ', `Contract ${contract.hostname} > ${contract.filepath} failed to solve`);
            ns.tprint(Log.INFO('Essais restant', ns.codingcontract.getNumTriesRemaining(contract.filepath, contract.hostname)));
        }*/
    //};
}

/**
 * Description : It is possible write four as a sum in exactly four different ways:
 * 
 *     3 + 1
 *     2 + 2
 *     2 + 1 + 1
 *     1 + 1 + 1 + 1
 * 
 * How many different distinct ways can the number 52 be written as a sum of at least two positive integers?
 */
function getSolution(ns: NS, data: number): string[] {
    return Array.from(new Set(getPossibleOperation(ns, data)
        .filter(x => x.length > 1)
        .map(x => {
            return x.sort()
        }).map(x => {
            return x.join(OPERATOR)
        })));
}

const OPERATOR: string  = ' + '
function getPossibleOperation(ns: NS, data: number): number[][] {
    let result: number[][] = [];

    for (let i=1; i < Math.floor(data/2)+1; i++) {
        const number1: number = i;
        const number2: number = data-i;

        result.push([number1, number2]);
        result.push(...getPossibleOperation(ns, number2).map(x => [number1, ...x]));
    }
    

    return result;
}
