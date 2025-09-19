import { CodingContractResolver } from 'workspace/socle/interface/coding-contract-resolver';
import * as Log from 'workspace/socle/utils/logging';

export async function main(ns: NS) {
    const resolver: ArrayJumpingGameResolver = new ArrayJumpingGameResolver(ns);
    
    await resolver.run();
}

class ArrayJumpingGameResolver extends CodingContractResolver {
    constructor(ns: NS) {
        super(
            ns, 
            [
                ns.enums.CodingContractName.ArrayJumpingGame,
                ns.enums.CodingContractName.ArrayJumpingGameII
            ]
        );
    }

    protected getSolution(codingContract: CodingContractObject) {
        if (codingContract.type === this.ns.enums.CodingContractName.ArrayJumpingGame) {
            return this.getSolutionI(codingContract);
        } else if (codingContract.type === this.ns.enums.CodingContractName.ArrayJumpingGameII) {
            return this.getSolutionII(codingContract);
        }

        this.logger.err(`Type (${codingContract}) non pris en charge`);
    }
        
    /**
     * Description : You are given the following array of integers: 0,3,0,6,2,4,9,8
     * 
     * Each element in the array represents your MAXIMUM jump length at that position. This means that if you are at position i and your maximum jump length is n, you can jump to any position from i to i+n. 
     * 
     * Assuming you are initially positioned at the start of the array, determine whether you are able to reach the last index.
     * 
     * Your answer should be submitted as 1 or 0, representing true and false respectively.
     */
    private getSolutionI(contract: CodingContractObject): number {
        let solution: number = this.getSolutionII(contract);
            
        return solution > 0 ? 1 : 0;
    }

    private getSolutionII(contract: CodingContractObject): number {
        const data: number[] = contract.data as number[];
        this.logger.trace(Log.INFO('Données', data));
        
        let position: number = 0;
        
        let jumpNumber: number = 1;
        while (position + data[position] < data.length - 1) {
            // end unreacheable
            if (data[position] <= 0 ) {
                return 0;
            }

            // get range of possible next position
            let possibleNext = data.slice(position + 1, position + data[position]+1);

            this.logger.trace(Log.INFO('Next possible position', possibleNext));
            // get best new position
            position += possibleNext
                .map((value: number, index: number) => {
                    return {index: index, jumpRate: value - (possibleNext.length-1 - index)}
                    })
                .reduce((x, y) => {
                    if (x.jumpRate < y.jumpRate) {
                        return y;
                    }
                    return x;
                }).index + 1;
                
            this.logger.trace(Log.INFO('Jump to position', position));

            // jump
            jumpNumber++;
        }

        return jumpNumber;
    }

}
