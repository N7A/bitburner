import { CodingContractResolver } from 'workspace/socle/interface/coding-contract-resolver';
import * as Log from 'workspace/socle/utils/logging';

export async function main(ns: NS) {
    const resolver: HammingCodesEncodedBinaryToIntegerResolver = new HammingCodesEncodedBinaryToIntegerResolver(ns);
    
    await resolver.run();
}

class HammingCodesEncodedBinaryToIntegerResolver extends CodingContractResolver {
    constructor(ns: NS) {
        super(
            ns, 
            [
                ns.enums.CodingContractName.HammingCodesEncodedBinaryToInteger,
                ns.enums.CodingContractName.HammingCodesIntegerToEncodedBinary
            ]
        );
    }

    protected getSolution(codingContract: CodingContractObject): number | string {
        if (codingContract.type === this.ns.enums.CodingContractName.HammingCodesEncodedBinaryToInteger) {
            const data: string = codingContract.data as string;
            this.logger.trace(Log.INFO('Données', data));

            return this.getSolutionI(data);
        } else if (codingContract.type === this.ns.enums.CodingContractName.HammingCodesIntegerToEncodedBinary) {
            const data: number = codingContract.data as number;
            this.logger.trace(Log.INFO('Données', data));

            return this.getSolutionII(data);
        }

        this.logger.err(`Type (${codingContract}) non pris en charge`);
    }

    /**
     * Description : You are given the following encoded binary string: '0010100010000000100000000000000011011101011100010100100000010110'
     * 
     * Decode it as an 'extended Hamming code' and convert it to a decimal value.
     * The binary string may include leading zeroes.
     * A parity bit is inserted at position 0 and at every position N where N is a power of 2.
     * Parity bits are used to make the total number of '1' bits in a given set of data even.
     * The parity bit at position 0 considers all bits including parity bits.
     * Each parity bit at position 2^N alternately considers 2^N bits then ignores 2^N bits, starting at position 2^N.
     * The endianness of the parity bits is reversed compared to the endianness of the data bits:
     * Data bits are encoded most significant bit first and the parity bits encoded least significant bit first.
     * The parity bit at position 0 is set last.
     * There is a ~55% chance for an altered bit at a random index.
     * Find the possible altered bit, fix it and extract the decimal value.
     * 
     * Examples:
     * '11110000' passes the parity checks and has data bits of 1000, which is 8 in binary.
     * '1001101010' fails the parity checks and needs the last bit to be corrected to get '1001101011', after which the data bits are found to be 10101, which is 21 in binary.
     * 
     * For more information on the 'rule' of encoding, refer to Wikipedia (https://wikipedia.org/wiki/Hamming_code) or the 3Blue1Brown videos on Hamming Codes. (https://youtube.com/watch?v=X8jsijhllIA)
     * 
     * @param codingContract 
     * @returns 
     */
    private getSolutionI(encodedData: string): number {
        let dataToDecode: string = encodedData;

        // en cas d'erreur
        if (!this.parityValid(encodedData)) {
            // on cherche la position de l'erreur
            const indexError = this.getIndexError(encodedData);
            // on inverse le bit
            const newValue = Number(encodedData.charAt(indexError)) ^ 1;
            // on corrige les données encodées
            dataToDecode = encodedData.substring(0, indexError) + newValue + encodedData.substring(indexError + 1);
        }
            
        const data: string = this.getData(dataToDecode);
        
        // convert binary to decimal
        return parseInt(data, 2);
    }

    private parityValid(data: string): boolean {
        return data.split('1').length-1 % 2 === 0;
    }

    private getData(encodedData: string): string {
        let data: string = '';
        for (let index = 1; index < encodedData.length; index++) {
            const element = encodedData[index];
            if(index % 2 === 0) {
                continue;
            }
            
            data += element;
        }
        return  data;
    }
    
    private getIndexError(encodedData: string): number {
        let parityInError: number[] = [];
        for (let parityBitCoverage = 0; Math.pow(2, parityBitCoverage) < encodedData.length; parityBitCoverage++) {
            if (this.hasError(encodedData, parityBitCoverage)) {
                parityInError.push(Math.pow(2, parityBitCoverage));
            }
        }

        // si pas d'erreur trouvé c'est le bit 0 (check global) qui est en erreur
        if (parityInError.length === 0) {
            return 0;
        }

        // si un seul bit en erreur c'est le bit de parité qui est faux
        // sinon la somme des bits de parité détectant une erreur donne la position
        parityInError.length === 1 ? parityInError[0] : parityInError.reduce((a,b) => a+b);
    }

    /**
     * Retourne le premier bloc contenant une erreur.
     * (On prend uniquement le premier bloc car l'énoncé anonce une seule erreur maximum)
     * 
     * @param encodedData 
     * @param parityBitCoverage 
     * @returns 
     */
    private hasError(encodedData: string, parityBitCoverage: number): boolean {
        for (let index = Math.pow(2, parityBitCoverage); index < encodedData.length; index+=Math.pow(2, parityBitCoverage+1)) {
            if (!this.parityValid(encodedData.substring(index, Math.pow(2, parityBitCoverage)))) {
                return true;
            }
        }
        return  false;
    }

    /**
     * Description : You are given the following decimal value: 16
     * 
     * Convert it to a binary representation and encode it as an 'extended Hamming code'.
     * The number should be converted to a string of '0' and '1' with no leading zeroes.
     * A parity bit is inserted at position 0 and at every position N where N is a power of 2.
     * Parity bits are used to make the total number of '1' bits in a given set of data even.
     * The parity bit at position 0 considers all bits including parity bits.
     * Each parity bit at position 2^N alternately considers 2^N bits then ignores 2^N bits, starting at position 2^N.
     * The endianness of the parity bits is reversed compared to the endianness of the data bits:
     * Data bits are encoded most significant bit first and the parity bits encoded least significant bit first.
     * The parity bit at position 0 is set last.
     * 
     * Examples:
     * 
     * 8 in binary is 1000, and encodes to 11110000 (pppdpddd - where p is a parity bit and d is a data bit)
     * 21 in binary is 10101, and encodes to 1001101011 (pppdpdddpd)
     * 
     * For more information on the 'rule' of encoding, refer to Wikipedia (https://wikipedia.org/wiki/Hamming_code) or the 3Blue1Brown videos on Hamming Codes. 
     * (https://youtube.com/watch?v=X8jsijhllIA)
     */
    private getSolutionII(data: number) {
        // convert decimal to binary
        let dataToEncode: string = data.toString(2);

        const PARITY_WAITING: string = '_'
        let encodedData: string = PARITY_WAITING + PARITY_WAITING;

        // ajout des positions des bits de parité
        while (dataToEncode.length > 0) {
            // position d'un bit de parité
            if (encodedData.length % 2 === 0) {
                // ajout d'un bit de parté aux données encodées
                encodedData += PARITY_WAITING;
                continue;
            }
            // ajout du premier caractère aux données encodées
            encodedData += dataToEncode[0];
            // suppression du premier caractère depuis les données à encoder
            dataToEncode = dataToEncode.substring(1);
        }

        // alimentation des bits de parité
        encodedData = this.calculateParity(encodedData);

        // ajout du bit de parité global
        const globalParity = this.parityValid(encodedData) ? '0' : '1';
        return globalParity + encodedData;
    }
    
    private calculateParity(encodedData: string): string {
        for (let parityBitCoverage = 0; Math.pow(2, parityBitCoverage) < encodedData.length; parityBitCoverage++) {
            // détermination de la valeur du bit de parité
            const parityValue = this.hasError(encodedData, parityBitCoverage) ? 1 : 0;
            // alimentation du bit de parité
            encodedData = encodedData.substring(0, Math.pow(2, parityBitCoverage)) + parityValue + encodedData.substring(Math.pow(2, parityBitCoverage) + 1);
        }

        return encodedData;
    }

}
