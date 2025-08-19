import { Headhunter } from 'workspace/common/headhunter';
import {main as getContracts} from 'workspace/resource-generator/coding-contract/contract.selector';
import { Contract } from 'workspace/resource-generator/coding-contract/model/Contract';

//#region Constantes
const getTargets = async (ns: NS) => {
    return await getContracts(ns);
}
const work = async (ns: NS, targets: Contract[]) => {
    const resolvers = ns.ls('home', 'workspace/coding-contract').filter(x => {
            return x.startsWith('workspace/resource-generator/coding-contract/') && x.endsWith('.resolve.ts');
        });
    for(const resolver of resolvers) {
        ns.run(resolver);
    }
}
//#endregion Constantes

export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);
    
    // waitNewTargets = true : contracts appear over the time
    const daemon = new Headhunter<Contract>(ns, () => getTargets(ns), work, true);
    
    if (!input.runHasLoop) {
        daemon.killAfterLoop();
    }
    
    daemon.run();
}

//#region Input arguments
type InputArg = {
	/** Serveur cible */
	runHasLoop: boolean;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
	return {
		runHasLoop: ns.args[0] ? (ns.args[0] as boolean) : false
	};
}
//#endregion Input arguments
