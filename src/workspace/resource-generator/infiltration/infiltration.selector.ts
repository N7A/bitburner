import { DirectiveType } from "workspace/resource-generator/infiltration/model/DirectiveType";
import { InfiltrationDifficulty } from "workspace/resource-generator/infiltration/model/InfiltrationDifficulty";
import { Info } from "workspace/socle/interface/info";
import { InfiltrationInfo } from "cmd/resource-generator/infiltration/infiltration.info";
import * as Log from 'workspace/socle/utils/logging';

/** @param {NS} ns */
export async function main(ns: NS) {
    const selector: InfiltrationSelector = new InfiltrationSelector(ns);

    selector.run();
}

export class InfiltrationSelector extends Info {
    constructor(ns: NS) {
        super(ns, 'Best infiltration');
    }

    printData() {
        for (const directive of InfiltrationSelector.getOptions()) {
            this.ns.print(Log.getStartLog());
            this.ns.print(Log.title(directive.toString()));

            const location = this.getBestLocation(directive as DirectiveType);
            const info = new InfiltrationInfo(this.ns, location.name);
            info.run();
            this.ns.print(Log.getEndLog());
        }
    }

    /**
     * 
     * @requires singularity
     * @param ns 
     * @param company 
     * @returns 
     */
    private getAvailableLocations(ns: NS): ILocation[] {
        return ns.infiltration.getPossibleLocations();
    }

    /**
     * 
     * @requires singularity
     * @param ns 
     * @returns 
     */
    public getBestLocation(directive: DirectiveType, city?: CityName): ILocation | undefined {
        return this.getAvailableLocations(this.ns)
            // filrage de la ville
            .filter(location => city === undefined || location.city === city)
            // difficulté normal maximum
            .filter(location => this.ns.infiltration.getInfiltration(location.name).difficulty <= InfiltrationDifficulty.NORMAL)
            .sort((a,b) => {
                let getGainAmount: (location: ILocation) => number;
                if (directive === DirectiveType.FACTION_REPUTATION) {
                    getGainAmount = (location: ILocation) => this.ns.infiltration.getInfiltration(location.name).reward.tradeRep
                } else if (directive === DirectiveType.MONEY) {
                    getGainAmount = (location: ILocation) => this.ns.infiltration.getInfiltration(location.name).reward.sellCash
                } else if (directive === DirectiveType.SOA_REPUTATION) {
                    getGainAmount = (location: ILocation) => this.ns.infiltration.getInfiltration(location.name).reward.SoARep
                }

                // défini la rentabilité par rapport l'effort demandé (nombre défi d'infiltration)
                const getProfitability = (location: ILocation) => 
                    getGainAmount(location) / this.ns.infiltration.getInfiltration(location.name).maxClearanceLevel;

                
                return getProfitability(a) - getProfitability(b);
            })
            .pop();
    }
    
	static getOptions(): (string | DirectiveType)[] {
		return Array.from(Object.values(DirectiveType));
	}

}
