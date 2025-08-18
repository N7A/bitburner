import {Contract} from 'workspace/coding-contract/model/Contract';
import {main as getContracts} from 'workspace/coding-contract/contract.selector';
import * as Log from 'workspace/frameworks/logging';

export async function main(ns: NS) {
    const contracts = (await getContracts(ns))
        .filter(x => [
            ns.enums.CodingContractName.ArrayJumpingGame,
            ns.enums.CodingContractName.ArrayJumpingGameII
        ].includes(ns.codingcontract.getContract(x.filepath, x.hostname).type));

    for(const contract of contracts) {
        ns.print(Log.INFO('Contrat', `${contract.hostname} > ${contract.filepath}`));
        let solution: number;

        const codingContract: CodingContractObject = ns.codingcontract.getContract(contract.filepath, contract.hostname)

        if (codingContract.type === ns.enums.CodingContractName.ArrayJumpingGame) {
            solution = getSolution(ns, codingContract);
        } else if (codingContract.type === ns.enums.CodingContractName.ArrayJumpingGameII) {
            solution = getSolutionII(ns , codingContract);
        } else {
            ns.print('ERROR', ' ', `Type (${codingContract}) non pris en charge`)
            continue;
        }

        ns.print(Log.INFO('Solution', solution));
        const reward = codingContract.submit(solution);
        if (reward) {
            ns.tprint('SUCCESS', ' ', `Contract ${contract.hostname} > ${contract.filepath} [solved]`);
            ns.tprint('INFO', ' ', Log.INFO('Reward', reward));
        } else {
            ns.tprint('ERROR', ' ', `Contract ${contract.hostname} > ${contract.filepath} failed to solve`);
            ns.tprint(Log.INFO('Essais restant', codingContract.numTriesRemaining));
        }
    };
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
function getSolution(ns: NS, contract: CodingContractObject): number {
    let solution: number = getSolutionII(ns , contract);
        
    return solution > 0 ? 1 : 0;
}

function getSolutionII(ns: NS, contract: CodingContractObject): number {
    const data: number[] = contract.data as number[];
    ns.print('Données : ' + data);
    
    let position: number = 0;
    
    let jumpNumber: number = 1;
    while (position + data[position] < data.length - 1) {
        // end unreacheable
        if (data[position] <= 0 ) {
            return 0;
        }

        // get range of possible next position
        let possibleNext = data.slice(position + 1, position + data[position]+1);

        ns.print('Next possible position', possibleNext);
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
            
        ns.print('Jump to position : ', position);

        // jump
        jumpNumber++;
    }

    return jumpNumber;
}
