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
                ns.enums.CodingContractName.FindAllValidMathExpressions
            ]
        );
    }

    protected getSolution(codingContract: CodingContractObject) {
        return this.getSolutionI(codingContract);
    }
    
    private getSolutionI(contract: CodingContractObject): string[] {
        const data: string|number[] = contract.data as string|number[];
        this.logger.trace(Log.INFO('Données', data));

        const digits: string = data[0] as string
        const targetNumber: number = data[1] as number

        let possibilite = this.getPossibilite('', digits);
        if (digits.startsWith('0')) {
            possibilite.push(digits)
        }
        return possibilite.filter(x => {
            const result: number = Function("return " + x)();
            return result === targetNumber;
        });
    }

    private getPossibilite(prefix: string, digits: string): string[] {
        let solution: string[] = [];

        for (let i=0; i < digits.length-1; i++) {
            for (const operator of Object.values(Operation)) {
                const newPrefix = digits.substring(0, i+1);
                const finalPrefix = prefix + newPrefix;
                const suffix = digits.substring(i+1);

                if (newPrefix.startsWith('0') && newPrefix.length > 1) {
                continue;
                }

                solution.push(...this.getPossibilite(finalPrefix + operator, suffix));
                
                if (suffix.startsWith('0') && suffix.length > 1) {
                continue;
                }
                
                solution.push(finalPrefix + operator + suffix);
            }
        }

        return solution;
    }
}

enum Operation {
    ADD = '+', 
    SUBSTRACT = '-',
    MULTIPLY = '*'
}