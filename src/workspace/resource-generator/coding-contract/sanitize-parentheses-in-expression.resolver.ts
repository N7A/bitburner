import * as Log from 'workspace/socle/utils/logging';
import { CodingContractResolver } from 'workspace/socle/interface/coding-contract-resolver';

export async function main(ns: NS) {
    const resolver: SanitizeParenthesesInExpressionResolver = new SanitizeParenthesesInExpressionResolver(ns);
    
    await resolver.run();
}

class SanitizeParenthesesInExpressionResolver extends CodingContractResolver {
    constructor(ns: NS) {
        super(
            ns, 
            [
                ns.enums.CodingContractName.SanitizeParenthesesInExpression
            ]
        );
    }

    protected getSolution(codingContract: CodingContractObject) {
        // mise en forme des données d'entrée
        const data: string = codingContract.data as string;
        this.logger.trace(Log.INFO('Données', data));
    
        // recherche de la solution
        return this.getSolutionI(data);
    }
    
    private readonly OPEN_CHARACTER = '(';
    private readonly CLOSE_CHARACTER = ')';
    private readonly EMPTY_CHARACTER = ' ';

    /**
     * Description : Given the following string: ())()())(((((

    * remove the minimum number of invalid parentheses in order to validate the string. If there are multiple minimal ways to validate the string, provide all of the possible results. The answer should be provided as an array of strings. If it is impossible to validate the string the result should be an array with only an empty string.

    * IMPORTANT: The string may contain letters, not just parentheses.

    * Examples:

    * "()())()" -> ["()()()", "(())()"]
    * "(a)())()" -> ["(a)()()", "(a())()"]
    * ")(" -> [""]
    */
    private getSolutionI(data: string): string[] {
        let result: string[] = [];

        // suppression des uncloseable et unopeneable
        const trimedData = data
            .replace(/^\)+/, '')
            .replace(/^([a-zA-Z]*)(\)+)/, '$1')
            .replace(/\(+$/, '')
            .replace(/(\(+)([a-zA-Z]*)$/, '$2');
        this.logger.trace(Log.INFO('trimedData', trimedData));
        
        let unclosed: number[] = [];
        let unopened: number[] = [];
        for (let i = 0; i < trimedData.length; i++) {
            if (trimedData.charAt(i) === this.OPEN_CHARACTER) {
                unclosed.push(i);
            } else if (trimedData.charAt(i) === this.CLOSE_CHARACTER) {
                if (unclosed.length > 0) {
                    unclosed.pop();
                } else {
                    unopened.push(i);
                }
            }
        }
        this.logger.trace(Log.INFO('unclosed', unclosed));
        this.logger.trace(Log.INFO('unopened', unopened));

        let unopenedSolutions = this.getCloseRemoved(trimedData, Array.from(unopened));
        let unclosedSolutions = this.getOpenRemoved(trimedData, Array.from(unclosed));

        for (const unopenedSolution of unopenedSolutions) {
            const prefix = unopened.length > 0 ? unopenedSolution.substring(0, unclosed.length > 0 ? Math.min(...unclosed) : unopenedSolution.length) : '';
            for (const unclosedSolution of unclosedSolutions) {
                const suffixe = unclosed.length > 0 ? unclosedSolution.substring(unopened.length > 0 ? Math.max(...unopened) : 0) : '';
                result.push(prefix + suffixe);
            }
        }
        
        return Array.from(new Set(result.map(x => x.replaceAll(this.EMPTY_CHARACTER, ''))));
    }

    private getCloseRemoved(data: string, unopened: number[]): string[] {
        let result: string[] = [];

        const index: number|undefined = unopened.shift();
        if (index === undefined) {
            return [data];
        }
        for (let i=0; i <= index; i++) {
            const charToRemove: number = data.indexOf(this.CLOSE_CHARACTER, i);
            if(charToRemove === -1) {
                return result;
            }
            let newData = data.substring(0, charToRemove) + this.EMPTY_CHARACTER + data.substring(charToRemove + this.CLOSE_CHARACTER.length);
            if (unopened.length > 0) {
                result.push(...this.getCloseRemoved(newData, Array.from(unopened)));
            } else {
                result.push(newData);
            }
            // passer les close adjacent
            i = data.indexOf(this.OPEN_CHARACTER, charToRemove);
            if (i === -1) {
                break;
            }
        }

        return result;
    }

    private getOpenRemoved(data: string, unclosed: number[]): string[] {
        let result: string[] = [];

        const index: number|undefined = unclosed.shift();
        if (index === undefined) {
            return [data];
        }

        for (let i=index; i < data.length; i++) {
            const charToRemove: number = data.indexOf(this.OPEN_CHARACTER, i);
            if(charToRemove === -1) {
                return result;
            }
            let newData = data.substring(0, charToRemove) + this.EMPTY_CHARACTER + data.substring(charToRemove + this.OPEN_CHARACTER.length);
            if (unclosed.length > 0) {
                result.push(...this.getOpenRemoved(newData, Array.from(unclosed)));
            } else {
                result.push(newData);
            }
            // passer les close adjacent
            i = data.indexOf(this.CLOSE_CHARACTER, charToRemove);
            if (i === -1) {
                break;
            }
        }

        return result;
    }
}
