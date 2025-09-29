import * as Log from 'workspace/socle/utils/logging';
import { CodingContractResolver } from 'workspace/socle/interface/coding-contract-resolver';

export async function main(ns: NS) {
    const resolver: FindAllValidMathExpressionsResolver = new FindAllValidMathExpressionsResolver(ns);
    
    await resolver.run();
}

class FindAllValidMathExpressionsResolver extends CodingContractResolver {
    constructor(ns: NS) {
        super(
            ns, 
            [
                ns.enums.CodingContractName.SpiralizeMatrix
            ]
        );
    }

    protected getSolution(codingContract: CodingContractObject): number[] {
        const data: number[][] = codingContract.data as number[][];
        return this.getSolutionI(data);
    }
    
    /**
     * Given the following array of arrays of numbers representing a 2D matrix, return the elements of the matrix as an array in spiral order:
     * 
     * [
     *     [14, 9,16,29,12,20,39]
     *     [20,35,40,45,44,33,21]
     *     [26,42, 3, 1,27,26, 1]
     *     [44,43, 8,39,39,26,35]
     *     [12,11,39,36,21, 3, 4]
     *     [49,10,44, 2,39,12,15]
     *     [29,34, 9,39, 2,45,22]
     *     [ 4,41,40, 7,29,39, 9]
     *     [43,36, 8,34,38,25,31]
     *     [50,27,44,27, 3,47,17]
     *     [42,12,26,16,36, 2,50]
     * ]
     * 
     * Here is an example of what spiral order should be:
     * 
     * [
     *    [1, 2, 3]
     *    [4, 5, 6]
     *    [7, 8, 9]
     * ]
     * 
     * Answer: [1, 2, 3, 6, 9, 8 ,7, 4, 5]
     * 
     * Note that the matrix will not always be square:
     * 
     * [
     *     [1,  2,  3,  4]
     *     [5,  6,  7,  8]
     *     [9, 10, 11, 12]
     * ]
     * 
     * Answer: [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]
     * 
     * @param data 
     * @returns 
     */
    private getSolutionI(data: number[][]): number[] {
        this.logger.trace(Log.INFO('Données', data));

        let result: number[] = [];
        
        while(data.filter(x => x.length > 0).length > 0) {
            result.push(...data.shift());
            
            if (data.filter(x => x.length > 0).length === 0) {
                break;
            }
        
            for (let index = 0; index < data.length-1; index++) {
                result.push(data[index].pop());
            }

            if (data.filter(x => x.length > 0).length === 0) {
                break;
            }
            
            result.push(...data.pop().reverse());
            
            if (data.filter(x => x.length > 0).length === 0) {
                break;
            }
        
            for (let index = data.length-1; index > 0; index--) {
                result.push(data[index].shift());
            }
        }
        
        return result;
    }

}

enum Operation {
    ADD = '+', 
    SUBSTRACT = '-',
    MULTIPLY = '*'
}