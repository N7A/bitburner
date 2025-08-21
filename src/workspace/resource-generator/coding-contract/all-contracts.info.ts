import * as Log from 'workspace/frameworks/logging';
import {main as getContracts} from 'workspace/resource-generator/coding-contract/contract.selector';

export async function main(ns: NS) {
    setupDashboard(ns);

    // TODO : afficher par type
    ns.print(Log.getStartLog())
    const contracts = (await getContracts(ns)).filter(contract => ![
            ns.enums.CodingContractName.EncryptionICaesarCipher.toString(),
            ns.enums.CodingContractName.EncryptionIIVigenereCipher.toString()
        ].includes(ns.codingcontract.getContractType(contract.filepath, contract.hostname)));
    for (const contract of contracts) {
        ns.print(Log.INFO('Serveur', contract.hostname));
        ns.print(Log.INFO('Fichier', contract.filepath));
        ns.print(Log.INFO('Type', ns.codingcontract.getContractType(contract.filepath, contract.hostname)));
        ns.print('----------')
    }
    ns.print(Log.getEndLog());
    ns.print(Log.INFO('Nombre de contrat', contracts.length));
}

//#region Dashboard
function setupDashboard(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();
    
    Log.initTailTitle(ns, 'Contract', 'info');
    
    ns.ui.openTail();
}
//#endregion Dashboard
