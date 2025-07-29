import {Contract} from 'workspace/coding-contract/model/Contract';
import * as ServersRepository from 'workspace/domain/servers/servers.repository';
import * as Log from 'workspace/logging-framework/main';

export async function main(ns: NS) {
    const servers = ServersRepository.getAll(ns);
    const contracts = getCurrentContracts(ns, servers)
        .filter(x => [
            ns.enums.CodingContractName.ArrayJumpingGame,
            ns.enums.CodingContractName.ArrayJumpingGameII
        ].includes(ns.codingcontract.getContract(x.filepath, x.hostname).type));

    for(const contract of contracts) {
        ns.print(Log.INFO('Contrat', `${contract.hostname} > ${contract.filepath}`));
        let solution: number;

        const codingContract: CodingContractObject = ns.codingcontract.getContract(contract.filepath, contract.hostname)

        if (codingContract.type === ns.enums.CodingContractName.ArrayJumpingGame) {
            solution = getSolution(ns, contract);
        } else if (codingContract.type === ns.enums.CodingContractName.ArrayJumpingGameII) {
            solution = getSolutionII(ns , contract);
        } else {
            ns.print('ERROR', ' ', `Type (${codingContract}) non pris en charge`)
            continue;
        }

        ns.print(Log.INFO('Solution', solution));
        let reward = ns.codingcontract.attempt(solution, contract.filepath, contract.hostname);
        if (reward) {
            ns.tprint('SUCCESS', ' ', `Contract ${contract.hostname} > ${contract.filepath} [solved]`);
            ns.tprint('INFO', ' ', Log.INFO('Reward', reward));
        } else {
            ns.tprint('ERROR', ' ', `Contract ${contract.hostname} > ${contract.filepath} failed to solve`);
            ns.tprint(Log.INFO('Essais restant', ns.codingcontract.getNumTriesRemaining(contract.filepath, contract.hostname)));
        }
    };
}

function getCurrentContracts(ns: NS, hostnames: string[]): Contract[] {
    return hostnames.flatMap(
        hostname => ns.ls(hostname)
        .filter(x => x.endsWith('.cct'))
        .map(x => {return {hostname: hostname, filepath: x} as Contract})
    );
}

function getSolution(ns: NS, contract: Contract): number {
    let solution: number = getSolutionII(ns , contract);
        
    return solution > 0 ? 1 : 0;
}

function getSolutionII(ns: NS, contract: Contract): number {
    const data: number[] = ns.codingcontract.getData(contract.filepath, contract.hostname);
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
