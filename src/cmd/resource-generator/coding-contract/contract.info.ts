import * as Log from 'workspace/socle/utils/logging';
import {main as getContracts} from 'workspace/resource-generator/coding-contract/contract.selector';
import { Logger } from 'workspace/socle/Logger';

export async function main(ns: NS) {
    const input: InputArg = getInput(ns);

    setupDashboard(ns);

    ns.print(Log.getStartLog())
    const contract = (await getContracts(ns))
        .filter(x => x.filepath === input.contratFilepath)
        .shift();
            
    const codingContract: CodingContractObject = ns.codingcontract.getContract(contract.filepath, contract.hostname)

    ns.print(Log.INFO('Server', contract.hostname));
    ns.print(Log.INFO('Fichier', contract.filepath));
    ns.print(Log.INFO('Type', codingContract.type));
    ns.print(Log.INFO('Data', codingContract.data));
    ns.print(Log.INFO('Description', codingContract.description));
    ns.print(Log.INFO('Essais restant', codingContract.numTriesRemaining()));
    ns.print(Log.getEndLog());
}

//#region Input parameters
type InputArg = {
    contratFilepath: string;
}

/**
 * Load input parameters
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
    const logger = new Logger(ns);
    if (ns.args[0] === undefined) {
        logger.err('Merci de renseigner un contrat');
        ns.exit();
    }
    
    return {
        contratFilepath: (ns.args[0] as string)
    };
}
//#endregion Input parameters

//#region Dashboard
function setupDashboard(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();
    
    Log.initTailTitle(ns, 'Contract', 'info');
    
    ns.ui.openTail();
}
//#endregion Dashboard
