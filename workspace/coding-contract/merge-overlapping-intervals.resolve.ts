import {Contract} from 'workspace/coding-contract/model/Contract';
import {Interval} from 'workspace/coding-contract/model/Interval';
import {main as getContracts} from 'workspace/coding-contract/contract.selector';
import * as Log from 'workspace/frameworks/logging';

export async function main(ns: NS) {
    const contracts = (await getContracts(ns))
        .filter(x => ns.codingcontract.getContract(x.filepath, x.hostname).type === ns.enums.CodingContractName.MergeOverlappingIntervals);

    contracts.forEach(contract => {
        ns.print(Log.INFO('Contrat', `${contract.hostname} > ${contract.filepath}`));
        let solution: number[][] = getSolution(ns , contract);
        
        ns.print(Log.INFO('Solution', solution));
        let reward = ns.codingcontract.attempt(solution, contract.filepath, contract.hostname);
        if (reward) {
            ns.tprint('SUCCESS', ' ', `Contract ${contract.hostname} > ${contract.filepath} [solved]`);
            ns.tprint('INFO', ' ', Log.INFO('Reward', reward));
        } else {
            ns.tprint('ERROR', ' ', `Contract ${contract.hostname} > ${contract.filepath} failed to solve`);
            ns.tprint(Log.INFO('Essais restant', ns.codingcontract.getNumTriesRemaining(contract.filepath, contract.hostname)));
        }
    });
}

function getSolution(ns: NS, contract: Contract): number[][] {
    // load input arguments
    const input: InputArg = getInput(ns, contract);

    let result: Interval[] = [];

    const data: number[][] = ns.codingcontract.getData(input.filepath, input.hostname);
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

//#region Input arguments
type InputArg = {
    hostname: string;
    filepath: string;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS, contract: Contract): InputArg {
    let result: InputArg = {
        hostname: (ns.args[0] ?? contract?.hostname ?? ns.getHostname()) as string,
        filepath: (ns.args[1] ?? contract?.filepath) as string
    };

    return result;
}
//#endregion Input arguments

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