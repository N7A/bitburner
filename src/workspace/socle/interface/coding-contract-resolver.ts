import {Contract} from 'workspace/resource-generator/coding-contract/model/Contract';
import * as Log from 'workspace/socle/utils/logging';
import { Logger } from 'workspace/socle/Logger';
import { ResolveContracts } from 'cmd/resource-generator/coding-contract/resolve-contracts.scheduler';
import { Broker } from 'workspace/socle/utils/broker';
import { FailedContract } from 'workspace/resource-generator/coding-contract/domain/model/FailedContract';

export class CodingContractResolver {
    protected ns: NS;
    private types: CodingContractName[];
    protected logger: Logger;
    private failedContracts: FailedContract[];

    constructor(ns: NS, types: CodingContractName[]) {
        this.ns = ns;
        this.types = types;
        this.logger = new Logger(ns);
        this.failedContracts = [];
    }
    
    async run() {
        // get all contracts
        const allContracts: Contract[] = await Broker.peekResponse(this.ns, ResolveContracts.REQUEST_PORT);

        // get contracts resolvable
        const contractsToResolve = this.filterContract(allContracts);
        // remove handled contracts
        this.ns.clearPort(ResolveContracts.REQUEST_PORT);
        await Broker.pushData(
            this.ns, 
            ResolveContracts.REQUEST_PORT, 
            allContracts.filter(contract => contractsToResolve.every(x => x.filepath !== contract.filepath))
        );
        
        // reset failed contracts
        this.failedContracts = [];

        // try to resolves contracts
        for(const contract of contractsToResolve) {
            this.ns.print(Log.INFO('Contrat', `${contract.hostname} > ${contract.filepath}`));
            const codingContract: CodingContractObject = this.ns.codingcontract.getContract(contract.filepath, contract.hostname)

            this.resolve(contract, codingContract);
        }
        
        // FIX
        await Broker.pushData(this.ns, ResolveContracts.RESPONSE_PORT, JSON.stringify(this.failedContracts));
    }

    private filterContract(allContracts: Contract[]) {
        return allContracts.filter(x => this.types.includes(this.ns.codingcontract.getContract(x.filepath, x.hostname).type));
    }

    protected getSolution(codingContract: CodingContractObject): any {
        throw new Error('Not implemented yet');
    }

    private resolve(contract: Contract, codingContract: CodingContractObject) {
        let solution: any = this.getSolution(codingContract);
        if (solution === undefined) {
            return;
        }
        this.logger.trace(Log.INFO('Solution', solution));

        const reward = codingContract.submit(solution);
        if (reward) {
            this.logger.success(`Contract ${contract.hostname} > ${contract.filepath} [solved]`);
            this.logger.info(Log.INFO('Reward', reward));
        } else {
            this.logger.err(`Contract ${contract.hostname} > ${contract.filepath} failed to solve`);
            this.logger.info(Log.INFO('Essais restant', codingContract.numTriesRemaining()));
            this.failedContracts.push({contrat: contract, data: codingContract, errorMessage: `Solution tenté : ${solution.toString()}`});
        }
    }
}
