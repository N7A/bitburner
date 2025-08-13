import * as Log from 'workspace/frameworks/logging';
import { ServersRepository } from 'workspace/domain/servers/servers.repository';
import {Contract} from 'workspace/coding-contract/model/Contract';

export async function main(ns: NS) {
    const servers = ServersRepository.getAll(ns);
    ns.tprint(Log.getStartLog())
    const contracts = getCurrentContracts(ns, servers).filter(contract => ![
            ns.enums.CodingContractName.EncryptionICaesarCipher.toString(),
            ns.enums.CodingContractName.EncryptionIIVigenereCipher.toString()
        ].includes(ns.codingcontract.getContractType(contract.filepath, contract.hostname)));
    for (const contract of contracts) {
        ns.tprint(Log.INFO('Server', contract.hostname));
        ns.tprint(Log.INFO('Fichier', contract.filepath));
        ns.tprint(Log.INFO('Type', ns.codingcontract.getContractType(contract.filepath, contract.hostname)));
        ns.tprint(Log.INFO('Data', ns.codingcontract.getData(contract.filepath, contract.hostname)));
        ns.tprint(Log.INFO('Description', ns.codingcontract.getDescription(contract.filepath, contract.hostname)));
        ns.tprint(Log.INFO('Essais restant', ns.codingcontract.getNumTriesRemaining(contract.filepath, contract.hostname)));
        ns.tprint('----------')
    }
    ns.tprint(Log.getEndLog());
}

function getCurrentContracts(ns: NS, hostnames: string[]): Contract[] {
    return hostnames.flatMap(
        hostname => ns.ls(hostname)
        .filter(x => x.endsWith('.cct'))
        .map(x => {return {hostname: hostname, filepath: x} as Contract})
    );
}