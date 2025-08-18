import {Interval} from 'workspace/coding-contract/model/Interval';
import {main as getContracts} from 'workspace/coding-contract/contract.selector';
import * as Log from 'workspace/frameworks/logging';

export async function main(ns: NS) {
    const contracts = (await getContracts(ns))
        .filter(x => ns.codingcontract.getContract(x.filepath, x.hostname).type === ns.enums.CodingContractName.MergeOverlappingIntervals);

    contracts.forEach(contract => {
        ns.print(Log.INFO('Contrat', `${contract.hostname} > ${contract.filepath}`));
        const codingContract: CodingContractObject = ns.codingcontract.getContract(contract.filepath, contract.hostname)
        let solution: number[][] = getSolution(ns , codingContract);
        
        ns.print(Log.INFO('Solution', solution));
        const reward = codingContract.submit(solution);
        if (reward) {
            ns.tprint('SUCCESS', ' ', `Contract ${contract.hostname} > ${contract.filepath} [solved]`);
            ns.tprint('INFO', ' ', Log.INFO('Reward', reward));
        } else {
            ns.tprint('ERROR', ' ', `Contract ${contract.hostname} > ${contract.filepath} failed to solve`);
            ns.tprint(Log.INFO('Essais restant', codingContract.numTriesRemaining));
        }
    });
}

function getSolution(ns: NS, contract: CodingContractObject): number[][] {
    let result: Interval[] = [];

    const data: number[][] = contract.data as number[][];
    ns.print('Données : ' + data);
    
    for (const item of data) {
        const newInterval: Interval = {basse: item[0], haute: item[1]};
        result = integrate(result, newInterval);
    }
        
    return result
        // tri par intervale basse
        .sort((a, b) => a.basse - b.basse)
        .map(x => [x.basse, x.haute]);
}

function integrate(intervals: Interval[], newInterval: Interval) {
    for (const interval of intervals) {
        if (interval.haute >= newInterval.basse && newInterval.haute >= interval.basse) {
            intervals.splice(intervals.indexOf(interval), 1)
            return integrate(
                intervals, 
                {
                    basse: Math.min(interval.basse, newInterval.basse), 
                    haute: Math.max(interval.haute, newInterval.haute)
                }
            )
        }
    }

    intervals.push(newInterval);
    return intervals;
}