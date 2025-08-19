import {Contract} from 'workspace/resource-generator/coding-contract/model/Contract';
import {VigenereCipherData} from 'workspace/resource-generator/coding-contract/model/VigenereCipherData';
import {main as getContracts} from 'workspace/resource-generator/coding-contract/contract.selector';
import * as Log from 'workspace/frameworks/logging';

/**
 * Fusionner avec encryption I
 */
export async function main(ns: NS) {
    // récupération des contrats concernés
    const contracts: Contract[] = (await getContracts(ns))
        .filter(x => [
            ns.enums.CodingContractName.EncryptionIIVigenereCipher
        ].includes(ns.codingcontract.getContract(x.filepath, x.hostname).type));

    for(const contract of contracts) {
        ns.print(Log.INFO('Contrat', `${contract.hostname} > ${contract.filepath}`));
        const codingContract: CodingContractObject = ns.codingcontract.getContract(contract.filepath, contract.hostname)

        // mise en forme des données d'entrée
        const rawData = codingContract.data;
        ns.print('Données : ' + rawData);
        const graphData: VigenereCipherData = {
            plaintext: rawData[0],
            keyword: rawData[1]
        }
        
        // recherche de la solution
        let solution: string = getSolution(graphData);
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

/**
 * Description : Vigenère cipher is a type of polyalphabetic substitution. It uses  the Vigenère square to encrypt and decrypt plaintext with a keyword.

 * Vigenère square:
 *          A B C D E F G H I J K L M N O P Q R S T U V W X Y Z 
 *        +----------------------------------------------------
 *      A | A B C D E F G H I J K L M N O P Q R S T U V W X Y Z 
 *      B | B C D E F G H I J K L M N O P Q R S T U V W X Y Z A 
 *      C | C D E F G H I J K L M N O P Q R S T U V W X Y Z A B
 *      D | D E F G H I J K L M N O P Q R S T U V W X Y Z A B C
 *      E | E F G H I J K L M N O P Q R S T U V W X Y Z A B C D
 *                 ...
 *      Y | Y Z A B C D E F G H I J K L M N O P Q R S T U V W X
 *      Z | Z A B C D E F G H I J K L M N O P Q R S T U V W X Y
 * 
 * For encryption each letter of the plaintext is paired with the corresponding letter of a repeating keyword. For example, the plaintext DASHBOARD is encrypted with the keyword LINUX:
 * Plaintext: DASHBOARD
 * Keyword:   LINUXLINU
 * So, the first letter D is paired with the first letter of the key L. Therefore, row D and column L of the  Vigenère square are used to get the first cipher letter O. This must be repeated for the whole ciphertext.
 * 
 * You are given an array with two elements:
 * ["FRAMETABLEARRAYCACHEENTER", "VIRTUAL"]
 * The first element is the plaintext, the second element is the keyword.

 * Return the ciphertext as uppercase string.
 */
function getSolution(data: VigenereCipherData): string {
    let solution: string = '';

    const firstCharCode = 'a'.charCodeAt(0);
    const lastCharCode = 'z'.charCodeAt(0);
    for (let i=0; i < data.plaintext.length; i++) {
        const shiftValue: number = data.keyword.toLowerCase().charCodeAt(i % data.keyword.length) - firstCharCode
        
        const charCode = data.plaintext.toLowerCase().charCodeAt(i);
        // si caractère non alphabetique
        if (charCode < firstCharCode || lastCharCode < charCode) {
            // on retourne le caractère
            solution += data.plaintext[i];
            continue;
        }

        let newCharCode = charCode + shiftValue;
        if (newCharCode < firstCharCode) {
            newCharCode = lastCharCode + 1 - (firstCharCode-newCharCode);
        } else if (newCharCode > lastCharCode) {
            newCharCode = firstCharCode + (newCharCode - lastCharCode) - 1;
        }

        const isCharUpercase: boolean = isUpercase(data.plaintext[i]);
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