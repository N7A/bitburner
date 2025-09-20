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

    /**
     * Description : A prime factor is a factor that is a prime number. 
     * 
     * What is the largest prime factor of 952204975?
     * 
     * @param codingContract 
     * @returns 
     */
    protected getSolution(codingContract: CodingContractObject): number {
        const data: number = codingContract.data as number;
        this.logger.trace(Log.INFO('Données', data));

        const primes: number[] = this.getPrimes(Math.floor(Math.sqrt(data)))
            // DESC
            .sort((a,b) => b - a);
        for (const prime of primes) {
            if (data % prime === 0) {
                return prime;
            }
        }

        return null;
    }

    /**
     * Sieve of Eratosthenes algorithm.
     * 
     * @param maxNumber maximum number to check
     * @returns 
     */
    private getPrimes(maxNumber: number): number[] {
        // init result
        let bulkPrime: boolean[] = new Array(maxNumber + 1).fill(true);

        // par définition 0 et 1 ne sont pas premier
        for (let i = 2; i * i <= maxNumber; i++) {
            if (bulkPrime[i]) {
                for (let j = i * i; j <= maxNumber; j += i) {
                    bulkPrime[j] = false;
                }
            }
        }

        return bulkPrime
            .map((value: boolean, index: number) => [value, index] as [boolean, number])
            .filter(x => x[0])
            .map(x => x[1]);
    }

}
