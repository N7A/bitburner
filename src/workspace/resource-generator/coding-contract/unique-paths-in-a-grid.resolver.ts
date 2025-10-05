import { CodingContractResolver } from 'workspace/socle/interface/coding-contract-resolver';
import * as Log from 'workspace/socle/utils/logging';

export async function main(ns: NS) {
    const resolver: UniquePathsInAGridResolver = new UniquePathsInAGridResolver(ns);
    
    await resolver.run();
}

class UniquePathsInAGridResolver extends CodingContractResolver {
    constructor(ns: NS) {
        super(
            ns, 
            [
                ns.enums.CodingContractName.UniquePathsInAGridI
            ]
        );
    }

    protected getSolution(codingContract: CodingContractObject): number {
        const data: [number, number] = codingContract.data as [number, number];
        this.logger.trace(Log.INFO('Données', data));

        return this.getSolutionI(data[0], data[1]);
    }

    /**
     * Description : You are in a grid with 3 rows and 8 columns, and you are positioned in the top-left corner of that grid. 
     * You are trying to reach the bottom-right corner of the grid, but you can only move down or right on each step. 
     * Determine how many unique paths there are from start to finish.
     * 
     * NOTE: The data returned for this contract is an array with the number of rows and columns: [3, 8]
     * 
     * @param codingContract 
     * @returns 
     */
    private getSolutionI(rows: number, columns: number): number {
        let pathNumber: number[] = new Array(rows).fill(1);
        
        for (let columnIndex = 1; columnIndex < columns; columnIndex++) {
            for (let rowIndex = 1; rowIndex < pathNumber.length; rowIndex++) {
                pathNumber[rowIndex] += pathNumber[rowIndex-1];                
            }
        }

        return pathNumber[rows-1];
    }

}
