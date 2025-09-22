import { CodingContractResolver } from 'workspace/socle/interface/coding-contract-resolver';
import * as Log from 'workspace/socle/utils/logging';

export async function main(ns: NS) {
    const resolver: MinimumPathSumInATriangleResolver = new MinimumPathSumInATriangleResolver(ns);
    
    await resolver.run();
}

class MinimumPathSumInATriangleResolver extends CodingContractResolver {
    constructor(ns: NS) {
        super(
            ns, 
            [
                ns.enums.CodingContractName.MinimumPathSumInATriangle
            ]
        );
    }

    /**
     * Description : Given a triangle, find the minimum path sum from top to bottom. 
     * In each step of the path, you may only move to adjacent numbers in the row below. 
     * The triangle is represented as a 2D array of numbers:
     * 
     * [
     *             [2],
     *            [7,8],          9|10
     *           [2,9,8],     11|18|19|18
     *          [6,9,4,4], 17|20|27|23|23|22
     *         [2,5,8,3,3],
     *        [7,2,9,1,5,7],
     *       [9,6,3,6,5,4,4],
     *      [3,8,8,9,2,6,9,4],
     *     [1,4,3,8,5,1,4,5,6],
     *    [2,7,3,8,2,5,3,2,1,3],
     *   [6,2,2,9,4,5,9,7,5,7,1]
     * ]
     * 
     * Example: If you are given the following triangle:
     * 
     * [
     *      [2],
     *     [3,4],
     *    [6,5,7],
     *   [4,1,8,3]
     * ]
     * 
     * The minimum path sum is 11 (2 -> 3 -> 5 -> 1).
     * 
     * @param codingContract 
     * @returns 
     */
    protected getSolution(codingContract: CodingContractObject): number {
        const data: number[][] = codingContract.data as number[][];
        this.logger.trace(Log.INFO('Données', data));

        let path: number[] = [];

        let previousRow = data.shift();

        for (let index = 0; index < data.length; index++) {
            const row = data[index];
            for (let index = 0; index < row.length; index++) {
                const element = row[index];
                
            }

            path.push(previousRow[]);

            previousRow = data.shift();
        }

        return path.reduce((a,b) => a+b);
    }
    
}
