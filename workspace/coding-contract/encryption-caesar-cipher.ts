import {Contract} from 'workspace/coding-contract/model/Contract';
import * as ServersRepository from 'workspace/domain/servers/servers.repository';
import * as Log from 'workspace/logging-framework/main';

export async function main(ns: NS) {
    const servers = ServersRepository.getAll(ns);
    const contracts = getCurrentContracts(ns, servers)
        .filter(x => [
            ns.enums.CodingContractName.EncryptionICaesarCipher
        ].includes(ns.codingcontract.getContract(x.filepath, x.hostname).type));

    for(const contract of contracts) {
        ns.print(Log.INFO('Contrat', `${contract.hostname} > ${contract.filepath}`));
        let solution: string;

        solution = getSolutionI(ns, contract);

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

function getSolutionI(ns: NS, contract: Contract): string {
    const data: string|number[] = ns.codingcontract.getData(contract.filepath, contract.hostname);
    ns.print('Données : ' + data);

    let solution: string = '';

    const leftShiftValue: number = data[1] as number
        
    const aCharCode = 'a'.charCodeAt(0);
    const zCharCode = 'z'.charCodeAt(0);
    for (const char of data[0] as string) {
        const charCode = char.toLowerCase().charCodeAt(0);
        // si caractère non alphabetique
        if (charCode < aCharCode || zCharCode < charCode) {
            // on retourne le caractère
            solution += char;
            continue;
        }

        let newCharCode = charCode - leftShiftValue;
        if (newCharCode < aCharCode) {
            newCharCode = zCharCode + 1 - (aCharCode-newCharCode);
        }

        const isCharUpercase: boolean = isUpercase(char);
        let newChar = String.fromCharCode(newCharCode)
        if(isCharUpercase) {
            newChar = newChar.toUpperCase()
        }
        solution += newChar;
    }

    return solution;
}

function isUpercase(char: string): boolean {
    return (char === char.toUpperCase());
}