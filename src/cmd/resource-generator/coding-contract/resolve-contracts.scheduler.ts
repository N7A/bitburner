import { Headhunter } from 'workspace/socle/interface/headhunter';
import {main as getContracts} from 'workspace/resource-generator/coding-contract/contract.selector';
import { Contract } from 'workspace/resource-generator/coding-contract/model/Contract';
import { getFilepaths } from 'workspace/socle/utils/file';
import { Broker } from 'workspace/socle/utils/broker';
import { waitEndExecution } from 'workspace/socle/utils/execution';
import { RejetsRepository } from 'workspace/resource-generator/coding-contract/domain/rejets.repository';
import { FailedContract } from '/workspace/resource-generator/coding-contract/domain/model/FailedContract';

//#region Constantes
export const RESOLVER_SCRIPT_DIRECTORY = 'workspace/resource-generator/coding-contract';
//#endregion Constantes

export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);
    
    // waitNewTargets = true : contracts appear over the time
    const daemon = new ResolveContracts(ns);
    
    if (!input.runHasLoop) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();
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
		runHasLoop: ns.args[0] !== undefined ? (ns.args[0] as boolean) : false
	};
}
//#endregion Input arguments

export class ResolveContracts extends Headhunter<Contract> {
    //#region Constants
    static readonly REQUEST_PORT = 3;
    static readonly RESPONSE_PORT = 4;
    //#endregion Constants

    private rejetsRepository: RejetsRepository;

    constructor(ns: NS) {
        // waitNewTargets = true : contracts appear over the time
        super(ns, true)

        this.rejetsRepository = new RejetsRepository(ns);
    }

    async work(targets: Contract[]) {
        // spread contracts to resolve
        await Broker.pushData(this.ns, ResolveContracts.REQUEST_PORT, targets);

        // find all resolver scripts
        const resolvers = getFilepaths(this.ns, 'home', RESOLVER_SCRIPT_DIRECTORY)
            .filter(x => x.endsWith('.resolver.ts'));
        
        // execute resolutions
        for(const resolver of resolvers) {
            // TODO: remove from BDD rejet si resolu
            await waitEndExecution(this.ns, this.ns.run(resolver));
        }

        // persist failed contracts
        const failedContracts: FailedContract[] = await Broker.getAllResponses(this.ns, ResolveContracts.RESPONSE_PORT);
        failedContracts.forEach(x => this.rejetsRepository.add(x.contrat.filepath, x));
    }

    async getTargets(): Promise<Contract[]> {
        return await getContracts(this.ns);
    }

}