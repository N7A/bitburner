import {GraphData} from 'workspace/resource-generator/coding-contract/model/GraphData';
import * as Log from 'workspace/socle/utils/logging';
import { CodingContractResolver } from 'workspace/socle/interface/coding-contract-resolver';

export async function main(ns: NS) {
    const resolver: Proper2ColoringOfAGraphResolver = new Proper2ColoringOfAGraphResolver(ns);
    
    await resolver.run();
}

class Proper2ColoringOfAGraphResolver extends CodingContractResolver {
    constructor(ns: NS) {
        super(
            ns, 
            [
                ns.enums.CodingContractName.Proper2ColoringOfAGraph
            ]
        );
    }

    protected getSolution(codingContract: CodingContractObject) {
        // mise en forme des données d'entrée
        const rawData = codingContract.data;
        this.logger.trace(Log.INFO('Données', rawData));
        const graphData: GraphData = {
            verticesNumber: rawData[0],
            edges: rawData[1]
        }
        
        // recherche de la solution
        return this.getSolutionI(graphData);
    }
    
    /**
     * Description : You are given the following data, representing a graph: [11,[[0,5],[3,5],[3,4],[2,5],[1,10],[5,7],[3,4],[1,6],[0,8],[5,6],[1,3]]]
     * Note that "graph", as used here, refers to the field of graph theory, and has no relation to statistics or plotting. 
     * The first element of the data represents the number of vertices in the graph. 
     * Each vertex is a unique number between 0 and 10. 
     * The next element of the data represents the edges of the graph. 
     * Two vertices u,v in a graph are said to be adjacent if there exists an edge [u,v]. 
     * Note that an edge [u,v] is the same as an edge [v,u], as order does not matter. 
     * You must construct a 2-coloring of the graph, meaning that you have to assign each vertex in the graph a "color", either 0 or 1, 
     * such that no two adjacent vertices have the same color. 
     * Submit your answer in the form of an array, where element i represents the color of vertex i. 
     * If it is impossible to construct a 2-coloring of the given graph, instead submit an empty array.
     * 
     * Examples:
     * 
     * Input: [4, [[0, 2], [0, 3], [1, 2], [1, 3]]]
     * Output: [0, 0, 1, 1]

     * Input: [3, [[0, 1], [0, 2], [1, 2]]]
     * Output: []
     * 
     * @param data 
     * @returns 
     */
    private getSolutionI(data: GraphData): number[] {
        let coloredGraph: Map<number, number> = new Map();

        const vertexIds = Array.from(new Set(data.edges.flatMap(x => x)));

        // gestion des graphs avec des "ilots" (non completement connectés)
        while (vertexIds.filter(x => !coloredGraph.has(x)).length > 0) {
            const startVertex = vertexIds.filter(x => !coloredGraph.has(x))
                .shift();
            if (!startVertex) {
                break;
            }

            coloredGraph = this.colorVertex(startVertex, this.COLORS[0], data.edges, coloredGraph);

            // colorVertex return empty array then impossible resolution
            if (coloredGraph.size ===0) {
                return [];
            }
        }
        
        // if vertex not in graph set to any color
        return Array.from(Array(data.verticesNumber).keys())
            .map(x => coloredGraph.get(x) ?? this.COLORS[0]);
    }

    private readonly COLORS = [0,1];
    private colorVertex(vertex: number, color: number, edges: number[][], coloredGraph: Map<number, number>): Map<number, number> {
        this.logger.trace(Log.INFO('Vertex', vertex));
        // si vertex déjà colorisé
        if (coloredGraph.has(vertex) && coloredGraph.get(vertex) !== undefined) {
            this.logger.trace('Colored');
            // si on essaye de colorisé d'une couleur différente que l'actuelle
            if (color !== coloredGraph.get(vertex)) {
                // résolution impossible, retour d'une map vide
                this.logger.trace('Impossible');
                return new Map<number, number>();
            }
            return coloredGraph;
        }
        // colorisation du vertex
        coloredGraph.set(vertex, color);
        
        this.logger.trace(Log.INFO('Color', color));

        // récupération des connexions
        const connectedEdges = edges.filter(x => x.includes(vertex));
        // sélection d'une couleur différente
        const otherColor = this.COLORS.find(x => x != color) as number;
        for (const edge of connectedEdges) {
            // récupération du vertex connecté
            const connectedVertex = edge.find(x => x !== vertex);
            this.logger.trace(Log.INFO('Connected vertex', connectedVertex));
            if (!connectedVertex) {
                continue;
            } 

            // colorisation du vertex connecté
            coloredGraph = this.colorVertex(connectedVertex, otherColor, edges, coloredGraph);
            // si la map est vide on a détécté une impossibilité de résolution
            if (coloredGraph.size <= 0) {
                return coloredGraph
            }
        }

        return coloredGraph;
    }
}
