import {Contract} from 'workspace/resource-generator/coding-contract/model/Contract';
import {GraphData} from 'workspace/resource-generator/coding-contract/model/GraphData';
import {main as getContracts} from 'workspace/resource-generator/coding-contract/contract.selector';
import * as Log from 'workspace/frameworks/logging';

export async function main(ns: NS) {
    // récupération des contrats concernés
    const contracts: Contract[] = (await getContracts(ns))
        .filter(x => [
            ns.enums.CodingContractName.Proper2ColoringOfAGraph
        ].includes(ns.codingcontract.getContract(x.filepath, x.hostname).type));

    for(const contract of contracts) {
        ns.print(Log.INFO('Contrat', `${contract.hostname} > ${contract.filepath}`));
        const codingContract: CodingContractObject = ns.codingcontract.getContract(contract.filepath, contract.hostname)
        // mise en forme des données d'entrée
        const rawData = codingContract.data;
        ns.print('Données : ' + rawData);
        const graphData: GraphData = {
            verticesNumber: rawData[0],
            edges: rawData[1]
        }
        
        // recherche de la solution
        let solution: number[] = getSolution(ns, graphData);
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
 * Description : You are given the following data, representing a graph:
 [11,[[0,5],[3,5],[3,4],[2,5],[1,10],[5,7],[3,4],[1,6],[0,8],[5,6],[1,3]]]
 * Note that "graph", as used here, refers to the field of graph theory, and has no relation to statistics or plotting. The first element of the data represents the number of vertices in the graph. Each vertex is a unique number between 0 and 10. The next element of the data represents the edges of the graph. Two vertices u,v in a graph are said to be adjacent if there exists an edge [u,v]. Note that an edge [u,v] is the same as an edge [v,u], as order does not matter. You must construct a 2-coloring of the graph, meaning that you have to assign each vertex in the graph a "color", either 0 or 1, such that no two adjacent vertices have the same color. Submit your answer in the form of an array, where element i represents the color of vertex i. If it is impossible to construct a 2-coloring of the given graph, instead submit an empty array.

 * Examples:

 * Input: [4, [[0, 2], [0, 3], [1, 2], [1, 3]]]
 * Output: [0, 0, 1, 1]

 * Input: [3, [[0, 1], [0, 2], [1, 2]]]
 * Output: []
 */
function getSolution(ns: NS, data: GraphData): number[] {
    let coloredGraph: Map<number, number> = colorVertex(ns, 0, COLORS[0], data.edges, new Map());

    // TODO : vertex non connecté à 0 non pris en compte

    // if vertex not in graph set to any color
    return Array.from(Array(data.verticesNumber).keys())
        .map(x => coloredGraph.get(x) ?? COLORS[0]);
}

const COLORS = [0,1];
function colorVertex(ns: NS, vertex: number, color: number, edges: number[][], coloredGraph: Map<number, number>): Map<number, number> {
    ns.print('Vertex : ', vertex);
    // si vertex déjà colorisé
    if (coloredGraph.has(vertex) && coloredGraph.get(vertex) !== undefined) {
        ns.print('Colored');
        // si on essaye de colorisé d'une couleur différente que l'actuelle
        if (color !== coloredGraph.get(vertex)) {
            // résolution impossible, retour d'une map vide
            ns.print('Impossible');
            return new Map<number, number>();
        }
        return coloredGraph;
    }
    // colorisation du vertex
    coloredGraph.set(vertex, color);
    
    ns.print('Color : ', color);

    // récupération des connexions
    const connectedEdges = edges.filter(x => x.includes(vertex));
    // sélection d'une couleur différente
    const otherColor = COLORS.find(x => x != color) as number;
    for (const edge of connectedEdges) {
        // récupéraiton du vertex connecté
        const connectedVertex = edge.find(x => x !== vertex);
        ns.print('Connected vertex : ', connectedVertex);
        if (!connectedVertex) {
            continue;
        } 

        // colorisation du vertex connecté
        coloredGraph = colorVertex(ns, connectedVertex, otherColor, edges, coloredGraph);
        // si la map est vide on a détécté une impossibilité de résolution
        if (coloredGraph.size <= 0) {
            return coloredGraph
        }
    }

    return coloredGraph;
}