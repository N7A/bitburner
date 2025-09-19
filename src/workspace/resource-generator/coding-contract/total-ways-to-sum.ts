import * as Log from 'workspace/socle/utils/logging';
import { CodingContractResolver } from 'workspace/socle/interface/coding-contract-resolver';

export async function main(ns: NS) {
    const resolver: TotalWaysToSumResolver = new TotalWaysToSumResolver(ns);
    
    //await resolver.run();
    
    resolver.getSolutionI(6);
}

class TotalWaysToSumResolver extends CodingContractResolver {
    constructor(ns: NS) {
        super(
            ns, 
            [
                ns.enums.CodingContractName.TotalWaysToSum
            ]
        );
    }

    protected getSolution(codingContract: CodingContractObject) {// mise en forme des données d'entrée
        const data: number = codingContract.data as number;
        this.logger.trace(Log.INFO('Données', data));
        
        // recherche de la solution
        return this.getSolutionI(data);
    }
    
    /**
     * Description : It is possible write four as a sum in exactly four different ways:
     * 
     *     3 + 1
     *     2 + 2
     *     2 + 1 + 1
     *     1 + 1 + 1 + 1
     * 
     * How many different distinct ways can the number 52 be written as a sum of at least two positive integers?
     */
    /*private*/ public getSolutionI(data: number): string[] {
        return Array.from(new Set(this.getPossibleOperation(data)
            .filter(x => x.length > 1)
            .map(x => {
                return x.sort()
            }).map(x => {
                return x.join(this.OPERATOR)
            })));
    }

    private readonly OPERATOR: string  = ' + '
    private getPossibleOperation(data: number): number[][] {
        let result: number[][] = [];

        for (let i=1; i < Math.floor(data/2)+1; i++) {
            const number1: number = i;
            const number2: number = data-i;

            result.push([number1, number2]);
            result.push(...this.getPossibleOperation(number2).map(x => [number1, ...x]));
        }
        

        return result;
    }

}
