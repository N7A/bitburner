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
     *            [7,8],
     *           [2,9,8],
     *          [6,9,4,4],
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

        let bestPath: Node[] = [];
        let currentPath: Node[] = [];
        let visited: Node[] = [];

        let nodeToVisit: Node = {rowIndex: 0, columnIndex: 0};
        do {
            // go down
            do {
                visited.push(nodeToVisit);
                currentPath.push(nodeToVisit);
                
                nodeToVisit = this.getNodes(currentPath[currentPath.length-1])
                    .filter(x => x.rowIndex < data.length && x.columnIndex < data[x.rowIndex].length)
                    .filter(x => !visited.some(y => x.rowIndex === y.rowIndex && x.columnIndex === y.columnIndex))
                    .shift();
            } while (
                // tant qu'on peut descendre
                nodeToVisit !== undefined
                && (
                    // tant que best path n'est pas défini
                    bestPath.length <= 0 
                    // tant que c'est meilleur que le best path
                    || (this.getPathValue(data, bestPath) > this.getPathValue(data, currentPath) + this.getValue(data, nodeToVisit)))
            )

            // nouveau chemin complet et meilleur
            if (bestPath.length <= 0 || currentPath.length === data.length && this.getPathValue(data, bestPath) > this.getPathValue(data, currentPath)) {
                bestPath = [...currentPath];
            }

            // go up
            do {
                currentPath.pop();

                nodeToVisit = this.getNodes(currentPath[currentPath.length-1])
                    .filter(x => !visited.some(y => x.rowIndex === y.rowIndex && x.columnIndex === y.columnIndex))
                    .shift();
            } while (
                // tant qu'on peut remonter
                currentPath.length > 1
                // aucune visite possible
                && (nodeToVisit === undefined
                // tant que c'est forcement pire que le best path
                || this.getPathValue(data, bestPath) < this.getPathValue(data, currentPath) + this.getValue(data, nodeToVisit))
            )
        } while (
            !(currentPath.length === 1
            // aucune visite possible
            && (nodeToVisit === undefined))
        )

        return this.getPathValue(data, bestPath);
    }

    getPathValue(data: number[][], path: Node[]): number {
        return path.length > 0 ? path.map(x => this.getValue(data, x)).reduce((a,b) => a+b) : 0;
    }
    
    getValue(data: number[][], node: Node): number {
        return data[node.rowIndex][node.columnIndex];
    }
    
    getNodes(node: Node): Node[] {
            const left: Node = {rowIndex: node.rowIndex+1, columnIndex: node.columnIndex};
            const right: Node = {rowIndex: node.rowIndex+1, columnIndex: node.columnIndex + 1};
        return [left, right]
    }
    
}

type Node = {
    rowIndex: number;
    columnIndex: number;
}