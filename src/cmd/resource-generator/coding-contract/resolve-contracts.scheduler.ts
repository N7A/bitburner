import { Headhunter } from 'workspace/socle/interface/headhunter';
import {main as getContracts} from 'workspace/resource-generator/coding-contract/contract.selector';
import { Contract } from 'workspace/resource-generator/coding-contract/model/Contract';
import { getFilepaths, getScriptName } from 'workspace/socle/utils/file';
import { Broker } from 'workspace/socle/utils/broker';
import { waitEndExecution } from 'workspace/socle/utils/execution';
import { RejetsRepository } from 'workspace/resource-generator/coding-contract/domain/rejets.repository';
import { FailedContract } from 'workspace/resource-generator/coding-contract/domain/model/FailedContract';
import { Logger } from 'workspace/socle/Logger';
import * as Log from 'workspace/socle/utils/logging';
import { DaemonFlags } from 'workspace/common/model/DaemonFlags';

//#region Constantes
const FLAGS_SCHEMA: [string, string | number | boolean | string[]][] = [
    [DaemonFlags.oneshot, false]
];
export const RESOLVER_SCRIPT_DIRECTORY = 'workspace/resource-generator/coding-contract';
//#endregion Constantes

/**
 * @param {AutocompleteData} data - context about the game, useful when autocompleting
 * @param {string[]} args - current arguments, not including "run script.js"
 * @returns {string[]} - the array of possible autocomplete options
 */
export function autocomplete(data: AutocompleteData, args: string[]): string[] {
  return FLAGS_SCHEMA
    .map(x => '--' + x[0])
    .filter(flag => !args.includes(flag));
}

export async function main(ns: NS) {
    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);
    
    // waitNewTargets = true : contracts appear over the time
    const daemon = new ResolveContracts(ns);
    
    if (scriptFlags[DaemonFlags.oneshot]) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();
}

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
        this.logger = new Logger(ns);
    }

    async work(targets: Contract[]) {
        this.ns.clearPort(ResolveContracts.REQUEST_PORT);
        this.ns.clearPort(ResolveContracts.RESPONSE_PORT);

        // spread contracts to resolve
        await Broker.pushData(this.ns, ResolveContracts.REQUEST_PORT, targets);

        // find all resolver scripts
        const resolvers = getFilepaths(this.ns, 'home', RESOLVER_SCRIPT_DIRECTORY)
            .filter(x => x.endsWith('.resolver.ts'));
        
        // execute resolutions
        for(const resolver of resolvers) {
            // TODO: remove from BDD rejet si resolu
            await waitEndExecution(this.ns, this.ns.run(resolver));
            this.logger.success(`Resolver ${getScriptName(resolver)} executé [end]`)
        }

        this.logger.trace('Persist failed contracts');
        // persist failed contracts
        const failedContracts: FailedContract[] = (await Broker.getAllResponses(this.ns, ResolveContracts.RESPONSE_PORT))
            .flatMap(x => JSON.parse(x));
        failedContracts.filter(x => x?.contrat?.filepath).forEach(x => this.rejetsRepository.add(x.contrat.filepath, x));
        
        const newContracts = await this.getTargets();
        this.logger.info(Log.INFO('Contracts traités', targets.length - newContracts.length));
        this.logger.info(Log.INFO('Contracts échoués', failedContracts.length));
        const message = newContracts?.length < 10 ? JSON.stringify(newContracts, null, 4) : `(${newContracts.length})`
        this.logger.info(Log.INFO('Contracts restants', message));
    }

    async getTargets(): Promise<Contract[]> {
        return await getContracts(this.ns);
    }

}