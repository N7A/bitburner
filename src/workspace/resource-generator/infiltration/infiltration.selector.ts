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
            this.ns.print(Log.title(directive));
            const index = Object.keys(DirectiveType).map(x => Number(x)).filter(x => DirectiveType[x] == directive).pop()
            if (index === undefined) {
                continue;
            }
            const mappedDirective: DirectiveType = Object.values(DirectiveType)
                .filter((v) => !isNaN(Number(v)))
                .map(x => Number(x))
                .filter(x => DirectiveType[x] == directive)
                .map(x => x as DirectiveType)
                .pop();
            const location = this.getBestLocation(mappedDirective);
            const info = new InfiltrationInfo(this.ns, location.name);
            info.getMessages(location.name).forEach(x => this.ns.print(x));
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
                if (directive == DirectiveType.FACTION_REPUTATION) {
                    getGainAmount = (location: ILocation) => this.ns.infiltration.getInfiltration(location.name).reward.tradeRep
                } else if (directive == DirectiveType.MONEY) {
                    getGainAmount = (location: ILocation) => this.ns.infiltration.getInfiltration(location.name).reward.sellCash
                } else if (directive == DirectiveType.SOA_REPUTATION) {
                    getGainAmount = (location: ILocation) => this.ns.infiltration.getInfiltration(location.name).reward.SoARep
                }

                // défini la rentabilité par rapport l'effort demandé (nombre défi d'infiltration)
                const getProfitability = (location: ILocation) => 
                    getGainAmount(location) / this.ns.infiltration.getInfiltration(location.name).maxClearanceLevel;

                
                return getProfitability(a) - getProfitability(b);
            })
            .pop();
    }
    
	static getOptions(): string[] {
		return Array.from(Object.values(DirectiveType))
            .filter((v) => isNaN(Number(v)))
            .map(x => x as string);
	}

}
