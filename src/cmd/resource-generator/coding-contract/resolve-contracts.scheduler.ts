import { Headhunter } from 'workspace/socle/interface/headhunter';
import {main as getContracts} from 'workspace/resource-generator/coding-contract/contract.selector';
import { Contract } from 'workspace/resource-generator/coding-contract/model/Contract';
import { getFilepaths } from 'workspace/socle/utils/file';
import { Broker } from 'workspace/socle/utils/broker';
import { waitEndAllExecutions } from 'workspace/socle/utils/execution';
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
        await Broker.pushData(this.ns, ResolveContracts.REQUEST_PORT, targets);

        const resolvers = getFilepaths(this.ns, 'home', RESOLVER_SCRIPT_DIRECTORY)
            .filter(x => x.endsWith('.resolve.ts'));
        let pids = [];

        for(const resolver of resolvers) {
            // TODO: add to BDD rejet si echec
            // TODO: remove from BDD rejet si resolu
            const pid = this.ns.run(resolver);
            if (pid !== 0) {
                pids.push(pid);
            }
        }
        await waitEndAllExecutions(this.ns, pids)
        
        const failedContracts: FailedContract[] = await Broker.getAllResponses(this.ns, ResolveContracts.RESPONSE_PORT);
        failedContracts.forEach(x => this.rejetsRepository.add(x.contrat.filepath, x));
    }

    async getTargets(): Promise<Contract[]> {
        return await getContracts(this.ns);
    }

}