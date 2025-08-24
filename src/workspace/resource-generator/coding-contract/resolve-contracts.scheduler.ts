import { Headhunter } from 'workspace/common/headhunter';
import {main as getContracts} from 'workspace/resource-generator/coding-contract/contract.selector';
import { Contract } from 'workspace/resource-generator/coding-contract/model/Contract';
import { getFilepaths } from 'workspace/frameworks/file';

//#region Constantes
export const RESOLVER_SCRIPT_DIRECTORY = 'workspace/resource-generator/coding-contract';
//#endregion Constantes

export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);
    
    // waitNewTargets = true : contracts appear over the time
    const daemon = new Main(ns);
    
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

class Main extends Headhunter<Contract> {
    constructor(ns: NS) {
        // waitNewTargets = true : contracts appear over the time
        super(ns, true)
    }

    async work(targets: Contract[]) {
        const resolvers = getFilepaths(this.ns, 'home', RESOLVER_SCRIPT_DIRECTORY)
            .filter(x => x.endsWith('.resolve.ts'));
        for(const resolver of resolvers) {
            this.ns.run(resolver);
        }
    }

    async getTargets(): Promise<Contract[]> {
        return await getContracts(this.ns);
    }

}