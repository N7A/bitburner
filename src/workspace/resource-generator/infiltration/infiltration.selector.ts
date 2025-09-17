import { DirectiveType } from "workspace/resource-generator/infiltration/model/DirectiveType";

/**
 * Palier maximum pour chaque difficulté.
 */
enum InfiltrationDifficulty {
    TRIVIAL = 1,
    NORMAL = 35,
    HARD = 67,
    IMPOSSIBLE = 100
}

/**
 * 
 * @requires singularity
 * @param ns 
 * @param company 
 * @returns 
 */
function getAvailableLocations(ns: NS): ILocation[] {
    return ns.infiltration.getPossibleLocations();
}

/**
 * 
 * @requires singularity
 * @param ns 
 * @returns 
 */
export function getBestLocation(ns: NS, directive: DirectiveType): ILocation | undefined {
    return getAvailableLocations(ns)
        // difficulté normal maximum
        .filter(location => ns.infiltration.getInfiltration(location.name).difficulty <= InfiltrationDifficulty.NORMAL)
        .sort((a,b) => {
            let getGainAmount: (location: ILocation) => number;
            if (directive === DirectiveType.FACTION_REPUTATION) {
                getGainAmount = (location: ILocation) => ns.infiltration.getInfiltration(location.name).reward.tradeRep
            } else if (directive === DirectiveType.MONEY) {
                getGainAmount = (location: ILocation) => ns.infiltration.getInfiltration(location.name).reward.sellCash
            } else if (directive === DirectiveType.SOA_REPUTATION) {
                getGainAmount = (location: ILocation) => ns.infiltration.getInfiltration(location.name).reward.SoARep
            }

            // défini la rentabilité par rapport l'effort demandé (nombre défi d'infiltration)
            const getProfitability = (location: ILocation) => 
                getGainAmount(location) / ns.infiltration.getInfiltration(location.name).maxClearanceLevel;

            
            return getProfitability(a) - getProfitability(b);
        })
        .pop();
}
