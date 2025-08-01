import {Contract} from 'workspace/coding-contract/model/Contract';
import {main as getContracts} from 'workspace/coding-contract/contract.selector';
import * as Log from 'workspace/frameworks/logging';

export async function main(ns: NS) {
    const contracts = (await getContracts(ns))
        .filter(x => [
            ns.enums.CodingContractName.EncryptionICaesarCipher
        ].includes(ns.codingcontract.getContract(x.filepath, x.hostname).type));

    for(const contract of contracts) {
        ns.print(Log.INFO('Contrat', `${contract.hostname} > ${contract.filepath}`));
        let solution: string;

        solution = getSolutionI(ns, contract);

        ns.print(Log.INFO('Solution', solution));
        let reward = ns.codingcontract.attempt(solution, contract.filepath, contract.hostname);
        if (reward) {
            ns.tprint('SUCCESS', ' ', `Contract ${contract.hostname} > ${contract.filepath} [solved]`);
            ns.tprint('INFO', ' ', Log.INFO('Reward', reward));
        } else {
            ns.tprint('ERROR', ' ', `Contract ${contract.hostname} > ${contract.filepath} failed to solve`);
            ns.tprint(Log.INFO('Essais restant', ns.codingcontract.getNumTriesRemaining(contract.filepath, contract.hostname)));
        }
    }
}

/**
 * Description : Caesar cipher is one of the simplest encryption technique. It is a type of substitution cipher in which each letter in the plaintext  is replaced by a letter some fixed number of positions down the alphabet. For example, with a left shift of 3, D would be replaced by A,  E would become B, and A would become X (because of rotation).
 * 
 * You are given an array with two elements:
 *   ["MEDIA MACRO FRAME PRINT ARRAY", 21]
 * The first element is the plaintext, the second element is the left shift value.
 * 
 * Return the ciphertext as uppercase string. Spaces remains the same.
 */
function getSolutionI(ns: NS, contract: Contract): string {
    const data: string|number[] = ns.codingcontract.getData(contract.filepath, contract.hostname);
    ns.print('Données : ' + data);

    let solution: string = '';

    const leftShiftValue: number = data[1] as number
    
    const firstCharCode = 'a'.charCodeAt(0);
    const lastCharCode = 'z'.charCodeAt(0);
    for (const char of data[0] as string) {
        const charCode = char.toLowerCase().charCodeAt(0);
        // si caractère non alphabetique
        if (charCode < firstCharCode || lastCharCode < charCode) {
            // on retourne le caractère
            solution += char;
            continue;
        }

        let newCharCode = charCode - leftShiftValue;
        if (newCharCode < firstCharCode) {
            newCharCode = lastCharCode + 1 - (firstCharCode-newCharCode);
        }

        const isCharUpercase: boolean = isUpercase(char);
        let newChar = String.fromCharCode(newCharCode)
        if(isCharUpercase) {
            newChar = newChar.toUpperCase()
        }
        solution += newChar;
    }

    return solution;
}

function isUpercase(char: string): boolean {
    return (char === char.toUpperCase());
}