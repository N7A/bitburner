import { CodingContractResolver } from 'workspace/socle/interface/coding-contract-resolver';
import * as Log from 'workspace/socle/utils/logging';

export async function main(ns: NS) {
    const resolver: FindLargestPrimeFactorResolver = new FindLargestPrimeFactorResolver(ns);
    
    await resolver.run();
}

class FindLargestPrimeFactorResolver extends CodingContractResolver {
    constructor(ns: NS) {
        super(
            ns, 
            [
                ns.enums.CodingContractName.FindLargestPrimeFactor
            ]
        );
    }

    protected getSolution(codingContract: CodingContractObject): number {
        const data: number = codingContract.data as number;
        this.logger.trace(Log.INFO('Données', data));

        return this.getSolutionI(data);
    }

    /**
     * Description : A prime factor is a factor that is a prime number. 
     * 
     * What is the largest prime factor of 952204975?
     * 
     * @param codingContract 
     * @returns 
     */
    private getSolutionI(data: number) {
        if (data <= 1) {
            return 1;
        }

        let factor = 2;
        let secondFactor: number = data;
        
        // division tant que le résultat reste entier
        while (secondFactor % factor === 0) {
            secondFactor /= factor;
        }

        do {
            // facteur suivant
            ++factor;
            // division tant que le résultat reste entier
            while (secondFactor % factor === 0) {
                secondFactor /= factor;
            }
        } while (secondFactor > (factor) * (factor))

        return (secondFactor === 1 ? factor : secondFactor);
    }

}
