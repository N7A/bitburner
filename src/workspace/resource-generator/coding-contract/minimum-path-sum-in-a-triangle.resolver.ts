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

        let bestPath: number = Number.MAX_VALUE;
        let currentPath: Node[] = [];
        const bestValues: number[][] = (Array(data.length) as number[][]).fill([]);
        bestValues.forEach((x, i) => {
            bestValues[i] = (Array(data[i].length) as number[]).fill(Number.MAX_VALUE)
        })
        let visited: Node[] = [];

        let nodeToVisit: Node = new Node(0, 0);
        do {
            visited = visited.filter(x => currentPath.length < 1 || x.rowIndex > currentPath[currentPath.length-1].rowIndex);
            // go down
            while (
                // tant qu'on peut descendre
                nodeToVisit !== undefined
            ) {
                // save visit
                currentPath.push(nodeToVisit);
                visited.push(nodeToVisit);
                
                // get next to visit
                nodeToVisit = currentPath[currentPath.length-1].getNodesAdjacentes(data)
                    // non visité
                    .filter(x => bestValues[x.rowIndex][x.columnIndex] === Number.MAX_VALUE)
                    .filter(x => !visited.some(y => x.rowIndex === y.rowIndex && x.columnIndex === y.columnIndex))
                    .filter(x => (
                        // tant que best path n'est pas défini
                        bestPath === undefined 
                        // tant que c'est meilleur que le best path
                        || (bestPath > this.getPathValue(data, currentPath) + x.getValue(data))
                    ))
                    .shift();
            }
            
            const currentNode = currentPath[currentPath.length-1];
            const adj = currentNode.getNodesAdjacentes(data)
                .map(x => bestValues[x.rowIndex][x.columnIndex] !== Number.MAX_VALUE ? x.getValue(data) + bestValues[x.rowIndex][x.columnIndex] : undefined);
            
            // maj best path
            if (adj.length === 0) { // no adjacent
                bestValues[currentNode.rowIndex][currentNode.columnIndex] = 0;
            } else if (adj.some(x => x !== undefined && this.getPathValue(data, currentPath) + x <= bestPath)) {
                bestValues[currentNode.rowIndex][currentNode.columnIndex] = Math.min(
                    ...adj.filter(x => x !== undefined && this.getPathValue(data, currentPath) + x <= bestPath) as number[]
                );
            }

            // nouveau chemin complet et meilleur
            if (bestValues[currentNode.rowIndex][currentNode.columnIndex] != Number.MAX_VALUE) {
                bestPath = Math.min(
                    bestPath ?? Number.MAX_VALUE, 
                    this.getPathValue(data, currentPath) + bestValues[currentNode.rowIndex][currentNode.columnIndex]
                );
            }

            // go up
            currentPath.pop();
            nodeToVisit = currentPath[currentPath.length-1].getNodesAdjacentes(data)
                // non visité
                .filter(x => bestValues[x.rowIndex][x.columnIndex] == Number.MAX_VALUE)
                .filter(x => !visited.some(y => x.rowIndex === y.rowIndex && x.columnIndex === y.columnIndex))
                .filter(x => (
                    // tant que best path n'est pas défini
                    bestPath === undefined 
                    // tant que c'est meilleur que le best path
                    || (bestPath > this.getPathValue(data, currentPath) + x.getValue(data))
                ))
                .shift();
        } while (
            !(currentPath.length === 1
            // aucune visite possible
            && (nodeToVisit === undefined))
        )

        return bestPath;
    }

    getPathValue(data: number[][], path: Node[]): number {
        return path.length > 0 ? path.map(x => x.getValue(data)).reduce((a,b) => a+b) : 0;
    }
    
}

class Node {
    readonly rowIndex: number;
    readonly columnIndex: number;
    
    constructor(rowIndex: number, columnIndex: number) {
        this.rowIndex = rowIndex;
        this.columnIndex = columnIndex;
    }

    getValue(data: number[][]): number {
        return data[this.rowIndex][this.columnIndex];
    }

    isNodeInGraph(data: number[][]): boolean {
        return this.rowIndex < data.length && this.columnIndex < data[this.rowIndex].length;
    }
    
    getNodesAdjacentes(data: number[][]): Node[] {
            const left: Node = new Node(this.rowIndex+1, this.columnIndex);
            const right: Node = new Node(this.rowIndex+1, this.columnIndex + 1);
        return [left, right]// dans le graph
                .filter(x => x.isNodeInGraph(data));
    }
    
}