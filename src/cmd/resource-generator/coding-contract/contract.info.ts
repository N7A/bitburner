import * as Log from 'workspace/socle/utils/logging';
import {main as getContracts} from 'workspace/resource-generator/coding-contract/contract.selector';
import { Info } from 'workspace/socle/interface/info';
import { Contract } from 'workspace/resource-generator/coding-contract/model/Contract';

export async function main(ns: NS) {
    const input: InputArg = await getInput(ns);

    const contracts = await getContracts(ns);  
    const info: ContractInfo = new ContractInfo(
        ns, 
        input.contratFilepath === '--- All ---' ? null : contracts.find(x => x.filepath === input.contratFilepath)
    );

    info.run();
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
async function getInput(ns: NS): Promise<InputArg> {    
    // TODO: remplacer par le type de contrat ?
    let contratFilepath: string;
    if (ns.args[0] === undefined) {
        const contracts = await getContracts(ns);  
        contratFilepath = await ns.prompt('Merci de renseigner un contrat', { type: "select", choices: ['--- All ---', ...contracts.map(x => x.filepath)] }) as string
    } else {
        contratFilepath = (ns.args[0] as string);
    }
    
    return {
        contratFilepath: contratFilepath
    };
}
//#endregion Input parameters

class ContractInfo extends Info {
    private contract: Contract;

    constructor(ns: NS, contrat: Contract) {
        super(ns, contrat?.filepath ?? 'All');

        this.contract = contrat;
    }

    async printData() {
		if (this.contract !== null) {
            const contract = (await getContracts(this.ns))
                .filter(x => x.filepath === this.contract.filepath)
                .shift();
            
            const codingContract: CodingContractObject = this.ns.codingcontract.getContract(contract.filepath, contract.hostname)

            this.ns.print(Log.getStartLog())
            this.ns.print(Log.INFO('Server', contract.hostname));
            this.ns.print(Log.INFO('Fichier', contract.filepath));
            this.ns.print(Log.INFO('Type', codingContract.type));
            this.ns.print(Log.INFO('Data', codingContract.data));
            this.ns.print(Log.INFO('Description', codingContract.description));
            this.ns.print(Log.INFO('Essais restant', codingContract.numTriesRemaining()));
            this.ns.print(Log.getEndLog());
        } else {
            const contracts = (await getContracts(this.ns))
            contracts.forEach(contract => {
                const codingContract: CodingContractObject = this.ns.codingcontract.getContract(contract.filepath, contract.hostname)

                this.ns.print(Log.getStartLog())
                this.ns.print(Log.INFO('Server', contract.hostname));
                this.ns.print(Log.INFO('Fichier', contract.filepath));
                this.ns.print(Log.INFO('Type', codingContract.type));
                this.ns.print(Log.INFO('Data', codingContract.data));
                this.ns.print(Log.INFO('Description', codingContract.description));
                this.ns.print(Log.INFO('Essais restant', codingContract.numTriesRemaining()));
                this.ns.print(Log.getEndLog());
            })
            this.ns.print(Log.INFO('Nombre de contrat', contracts.length));
        }
    }
}