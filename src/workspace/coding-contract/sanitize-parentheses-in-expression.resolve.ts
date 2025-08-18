import { Contract } from 'workspace/coding-contract/model/Contract';
import {main as getContracts} from 'workspace/coding-contract/contract.selector';
import * as Log from 'workspace/frameworks/logging';

export async function main(ns: NS) {
    // récupération des contrats concernés
    const contracts: Contract[] = (await getContracts(ns))
        .filter(x => [
            ns.enums.CodingContractName.SanitizeParenthesesInExpression
        ].includes(ns.codingcontract.getContract(x.filepath, x.hostname).type));

    for(const contract of contracts) {
        ns.print(Log.INFO('Contrat', `${contract.hostname} > ${contract.filepath}`));
        const codingContract: CodingContractObject = ns.codingcontract.getContract(contract.filepath, contract.hostname)
        // mise en forme des données d'entrée
        const data: string = codingContract.data as string;
        ns.print('Données : ' + data);
    
        // recherche de la solution
        let solution: string[] = getSolution(ns, data);
        ns.print(Log.INFO('Solution', solution));

        // proposition la solution
        const reward = codingContract.submit(solution);
        if (reward) {
            ns.tprint('SUCCESS', ' ', `Contract ${contract.hostname} > ${contract.filepath} [solved]`);
            ns.tprint('INFO', ' ', Log.INFO('Reward', reward));
        } else {
            ns.tprint('ERROR', ' ', `Contract ${contract.hostname} > ${contract.filepath} failed to solve`);
            ns.tprint(Log.INFO('Essais restant', codingContract.numTriesRemaining()));
        }
    };
}

const OPEN_CHARACTER = '(';
const CLOSE_CHARACTER = ')';
const EMPTY_CHARACTER = ' ';

/**
 * Description : Given the following string: ())()())(((((

 * remove the minimum number of invalid parentheses in order to validate the string. If there are multiple minimal ways to validate the string, provide all of the possible results. The answer should be provided as an array of strings. If it is impossible to validate the string the result should be an array with only an empty string.

 * IMPORTANT: The string may contain letters, not just parentheses.

 * Examples:

 * "()())()" -> ["()()()", "(())()"]
 * "(a)())()" -> ["(a)()()", "(a())()"]
 * ")(" -> [""]
 */
function getSolution(ns: NS, data: string): string[] {
    let result: string[] = [];

    // suppression des uncloseable et unopeneable
    const trimedData = data
        .replace(/^\)+/, '')
        .replace(/^([a-zA-Z]*)(\)+)/, '$1')
        .replace(/\(+$/, '')
        .replace(/(\(+)([a-zA-Z]*)$/, '$2');
    ns.print('trimedData : ', trimedData)
    
    let unclosed: number[] = [];
    let unopened: number[] = [];
    for (let i = 0; i < trimedData.length; i++) {
        if (trimedData.charAt(i) === OPEN_CHARACTER) {
            unclosed.push(i);
        } else if (trimedData.charAt(i) === CLOSE_CHARACTER) {
            if (unclosed.length > 0) {
                unclosed.pop();
            } else {
                unopened.push(i);
            }
        }
    }
    ns.print('unclosed : ', unclosed)
    ns.print('unopened : ', unopened)

    let unopenedSolutions = getCloseRemoved(trimedData, Array.from(unopened));
    let unclosedSolutions = getOpenRemoved(trimedData, Array.from(unclosed));

    for (const unopenedSolution of unopenedSolutions) {
        const prefix = unopened.length > 0 ? unopenedSolution.substring(0, unclosed.length > 0 ? Math.min(...unclosed) : unopenedSolution.length) : '';
        for (const unclosedSolution of unclosedSolutions) {
            const suffixe = unclosed.length > 0 ? unclosedSolution.substring(unopened.length > 0 ? Math.max(...unopened) : 0) : '';
            result.push(prefix + suffixe);
        }
    }
    
    return Array.from(new Set(result.map(x => x.replaceAll(EMPTY_CHARACTER, ''))));
}

function getCloseRemoved(data: string, unopened: number[]): string[] {
    let result: string[] = [];

    const index: number|undefined = unopened.shift();
    if (index === undefined) {
        return [data];
    }
    for (let i=0; i <= index; i++) {
        const charToRemove: number = data.indexOf(CLOSE_CHARACTER, i);
        if(charToRemove === -1) {
            return result;
        }
        let newData = data.substring(0, charToRemove) + EMPTY_CHARACTER + data.substring(charToRemove + CLOSE_CHARACTER.length);
        if (unopened.length > 0) {
            result.push(...getCloseRemoved(newData, Array.from(unopened)));
        } else {
            result.push(newData);
        }
        // passer les close adjacent
        i = data.indexOf(OPEN_CHARACTER, charToRemove);
        if (i === -1) {
            break;
        }
    }

    return result;
}

function getOpenRemoved(data: string, unclosed: number[]): string[] {
    let result: string[] = [];

    const index: number|undefined = unclosed.shift();
    if (index === undefined) {
        return [data];
    }

    for (let i=index; i < data.length; i++) {
        const charToRemove: number = data.indexOf(OPEN_CHARACTER, i);
        if(charToRemove === -1) {
            return result;
        }
        let newData = data.substring(0, charToRemove) + EMPTY_CHARACTER + data.substring(charToRemove + OPEN_CHARACTER.length);
        if (unclosed.length > 0) {
            result.push(...getOpenRemoved(newData, Array.from(unclosed)));
        } else {
            result.push(newData);
        }
        // passer les close adjacent
        i = data.indexOf(CLOSE_CHARACTER, charToRemove);
        if (i === -1) {
            break;
        }
    }

    return result;
}