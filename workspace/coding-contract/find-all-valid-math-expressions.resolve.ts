import {Contract} from 'workspace/coding-contract/model/Contract';
import {main as getContracts} from 'workspace/coding-contract/contract.selector';
import * as Log from 'workspace/frameworks/logging';

export async function main(ns: NS) {
    const contracts = (await getContracts(ns))
        .filter(x => [
            ns.enums.CodingContractName.FindAllValidMathExpressions
        ].includes(ns.codingcontract.getContract(x.filepath, x.hostname).type));
    ns.print(Log.INFO('Cibles', contracts.map(x => x.filepath)));

    for(const contract of contracts) {
        ns.print(Log.INFO('Contrat', `${contract.hostname} > ${contract.filepath}`));
        let solution: string[];

        solution = getSolution(ns, contract);

        ns.print(Log.INFO('Solution', solution));
        let reward = ns.codingcontract.attempt(solution, contract.filepath, contract.hostname);
        if (reward) {
            ns.tprint('SUCCESS', ' ', `Contract ${contract.hostname} > ${contract.filepath} [solved]`);
            ns.tprint('INFO', ' ', Log.INFO('Reward', reward));
        } else {
            ns.tprint('ERROR', ' ', `Contract ${contract.hostname} > ${contract.filepath} failed to solve`);
            ns.tprint(Log.INFO('Essais restant', ns.codingcontract.getNumTriesRemaining(contract.filepath, contract.hostname)));
        }
    }
}

function getCurrentContracts(ns: NS, hostnames: string[]): Contract[] {
    return hostnames.flatMap(
        hostname => ns.ls(hostname)
        .filter(x => x.endsWith('.cct'))
        .map(x => {return {hostname: hostname, filepath: x} as Contract})
    );
}

enum Operation {
    ADD = '+', 
    SUBSTRACT = '-',
    MULTIPLY = '*'
}
function getSolution(ns: NS, contract: Contract): string[] {
    const data: string|number[] = ns.codingcontract.getData(contract.filepath, contract.hostname);
    ns.print('Données : ' + data);

    const digits: string = data[0] as string
    const targetNumber: number = data[1] as number

    let possibilite = getPossibilite('', digits);
    if (digits.startsWith('0')) {
        possibilite.push(digits)
    }
    return possibilite.filter(x => {
        const result: number = Function("return " + x)();
        return result === targetNumber;
    });
}

function getPossibilite(prefix: string, digits: string): string[] {
    let solution: string[] = [];

    for (let i=0; i < digits.length-1; i++) {
        for (const operator of Object.values(Operation)) {
            const newPrefix = digits.substring(0, i+1);
            const finalPrefix = prefix + newPrefix;
            const suffix = digits.substring(i+1);

            if (newPrefix.startsWith('0') && newPrefix.length > 1) {
              continue;
            }

            solution.push(...getPossibilite(finalPrefix + operator, suffix));
            
            if (suffix.startsWith('0') && suffix.length > 1) {
              continue;
            }
            
            solution.push(finalPrefix + operator + suffix);
        }
    }

    return solution;
}