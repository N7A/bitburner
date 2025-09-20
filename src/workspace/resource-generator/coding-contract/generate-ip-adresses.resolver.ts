import { CodingContractResolver } from 'workspace/socle/interface/coding-contract-resolver';
import * as Log from 'workspace/socle/utils/logging';

export async function main(ns: NS) {
    const resolver: GenerateIPAddressesResolver = new GenerateIPAddressesResolver(ns);
    
    await resolver.run();
}

class GenerateIPAddressesResolver extends CodingContractResolver {
    constructor(ns: NS) {
        super(
            ns, 
            [
                ns.enums.CodingContractName.GenerateIPAddresses
            ]
        );
    }

    /**
     * Description : Given the following string containing only digits, 
     * return an array with all possible valid IP address combinations that can be created from the string: 254115249204
     * Note that an octet cannot begin with a '0' unless the number itself is exactly '0'. 
     * For example, '192.168.010.1' is not a valid IP.
     * 
     * Examples:
     * 25525511135 -> ["255.255.11.135", "255.255.111.35"]
     * 1938718066 -> ["193.87.180.66"]
     * 
     * @param codingContract 
     * @returns 
     */
    protected getSolution(codingContract: CodingContractObject): string[] {
        const data: string = codingContract.data as string;
        this.logger.trace(Log.INFO('Données', data));

        let adresses: string[][] = [[]];

        for (let remainOctetNumber = 4; remainOctetNumber > 0; remainOctetNumber--) {
            let adressesMaj: string[][] = [];
            for (const octets of adresses) {
                const index = octets.map(x => x.length).reduce((a,b) => a+b);
                this.getAllValidStartOctet(data.substring(index), remainOctetNumber)
                    // on complete les adresses
                    .forEach(x => adressesMaj.push([...octets, x]));
            }
            adresses = adressesMaj;
        }

        return adresses.map(octets => octets.join('.'));
    }
    
    private getAllValidStartOctet(data: string, remainOctetNumber: number): string[] {
        const octetMinSize = Math.floor(data.length / remainOctetNumber);
        const octetMaxSize = Math.ceil(data.length / remainOctetNumber);

        let octets: string[] = [data.substring(0, octetMinSize)];
        if (octetMinSize !== octetMaxSize) {
            octets.push(data.substring(0, octetMaxSize))
        }

        return octets.filter(x => this.isValidOctet(x));
    }

    private isValidOctet(octet: string): boolean {
        return Number(octet) <= 255 && (!octet.startsWith('0') || octet === '0');
    }

}
