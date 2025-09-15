import { JobOrder } from "workspace/resource-generator/job/model/JobOrder";

function getCompanies(ns: NS): CompanyName[] {
    return Array.from(Object.values(ns.enums.CompanyName));
}

/**
 * 
 * @requires singularity
 * @param ns 
 * @param company 
 * @returns 
 */
function getAvailablePositions(ns: NS, company: CompanyName): CompanyPositionInfo[] {
    return ns.singularity.getCompanyPositions(company)
        .map(jobName => {
            return ns.singularity.getCompanyPositionInfo(company, jobName)
        })
        .filter(x => x.requiredReputation <= ns.singularity.getCompanyRep(company))
        .filter(x => {
            return x.requiredSkills.agility <= ns.getPlayer().skills.agility
                && x.requiredSkills.charisma <= ns.getPlayer().skills.charisma
                && x.requiredSkills.defense <= ns.getPlayer().skills.defense
                && x.requiredSkills.dexterity <= ns.getPlayer().skills.dexterity
                && x.requiredSkills.hacking <= ns.getPlayer().skills.hacking
                && x.requiredSkills.intelligence <= ns.getPlayer().skills.intelligence
                && x.requiredSkills.strength <= ns.getPlayer().skills.strength
        });
}

/**
 * 
 * @requires singularity
 * @param ns 
 * @returns 
 */
export function getBestWork(ns: NS): JobOrder | undefined {
    let bestWork: JobOrder | undefined = undefined;

    for(const currentCompany of getCompanies(ns)) {
        const currentBestPosition: CompanyPositionInfo | undefined = getAvailablePositions(ns, currentCompany)
            .sort((a,b) => a.salary - b.salary)
            .pop();

        if (currentBestPosition === undefined) {
            continue;
        }

        if ((bestWork?.position.salary ?? 0) < currentBestPosition.salary) {
            bestWork = {
                position: currentBestPosition,
                company: currentCompany
            };
        }
    }

    return bestWork;
}
