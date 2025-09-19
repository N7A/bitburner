import { CodingContractResolver } from 'workspace/socle/interface/coding-contract-resolver';
import { VigenereCipherData } from 'workspace/resource-generator/coding-contract/model/VigenereCipherData';
import * as Log from 'workspace/socle/utils/logging';

export async function main(ns: NS) {
    const resolver: EncryptionCaesarCipherResolver = new EncryptionCaesarCipherResolver(ns);
    
    await resolver.run();
}

class EncryptionCaesarCipherResolver extends CodingContractResolver {
    constructor(ns: NS) {
        super(
            ns, 
            [
                ns.enums.CodingContractName.EncryptionICaesarCipher,
                ns.enums.CodingContractName.EncryptionIIVigenereCipher
            ]
        );
    }
    
    protected getSolution(codingContract: CodingContractObject) {
        if (codingContract.type === this.ns.enums.CodingContractName.EncryptionICaesarCipher) {
            return this.getSolutionICaesarCipher(codingContract);
        } else if (codingContract.type === this.ns.enums.CodingContractName.EncryptionIIVigenereCipher) {
            // mise en forme des données d'entrée
            const rawData = codingContract.data;
            this.logger.trace(Log.INFO('Données', rawData));
            const graphData: VigenereCipherData = {
                plaintext: rawData[0],
                keyword: rawData[1]
            };

            return this.getSolutionIIVigenereCipher(graphData);
        }

        this.logger.err(`Type (${codingContract}) non pris en charge`);
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
    private getSolutionICaesarCipher(contract: CodingContractObject): string {
        const data: string|number[] = contract.data as string|number[];
        this.logger.trace(Log.INFO('Données', data));

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

            const isCharUpercase: boolean = this.isUpercase(char);
            let newChar = String.fromCharCode(newCharCode)
            if(isCharUpercase) {
                newChar = newChar.toUpperCase()
            }
            solution += newChar;
        }

        return solution;
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
    private getSolutionIIVigenereCipher(data: VigenereCipherData): string {
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

            const isCharUpercase: boolean = this.isUpercase(data.plaintext[i]);
            let newChar = String.fromCharCode(newCharCode)
            if(isCharUpercase) {
                newChar = newChar.toUpperCase()
            }
            solution += newChar;
        }

        return solution;
    }

    private isUpercase(char: string): boolean {
        return (char === char.toUpperCase());
    }
}