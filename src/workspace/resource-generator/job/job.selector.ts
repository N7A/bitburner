import { JobOrder } from "workspace/resource-generator/job/model/JobOrder";
import { WorkExperienceType } from "./model/WorkExperienceType";

function getCompanies(ns: NS): CompanyName[] {
    return Array.from(Object.values(ns.enums.CompanyName));
}

function getUniversities(): UniversityLocationName[] {
    return Array.from(Object.values(UniversityLocationName));
}

function getGyms(): GymLocationName[] {
    return Array.from(Object.values(GymLocationName));
}

function getFactions(ns: NS): FactionName[] {
    return Array.from(Object.values(ns.enums.FactionName));
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

function getBestGym(ns: NS, type: WorkExperienceType) {
    let bestGym: {
        location: GymLocationName,
        gymType: GymType
    }[] = []
    let bestExperience: number;

    const gyms = getGyms()
        .flatMap(locationName => Array.from(Object.values(ns.enums.GymType)).map(gymType => {
            return {
                    location: locationName,
                    gymType: gymType
                }
        }));

    for (const gym of gyms) {
        const currentExperience = ns.formulas.work.gymGains(ns.getPlayer(), gym.gymType, gym.location)[type];
        if (bestExperience < currentExperience) {
            bestExperience = currentExperience;
            bestGym = [gym]
        } else if (bestExperience === currentExperience) {
            bestGym.push(gym)
        }
    }

    return bestGym;
}

function getBestCourse(ns: NS, type: WorkExperienceType) {
    let bestCourses: {
        university: UniversityLocationName,
        classType: UniversityClassType
    }[] = []
    let bestExperience: number;

    const courses = getUniversities()
        .flatMap(university => Array.from(Object.values(ns.enums.UniversityClassType)).map(classType => {
            return {
                    university: university,
                    classType: classType
                }
        }));

    for (const course of courses) {
        const currentExperience = ns.formulas.work.universityGains(ns.getPlayer(), course.classType, course.university)[type];
        if (bestExperience < currentExperience) {
            bestExperience = currentExperience;
            bestCourses = [course]
        } else if (bestExperience === currentExperience) {
            bestCourses.push(course)
        }
    }

    return bestCourses;
}

function getBestFaction(ns: NS, type: WorkExperienceType) {
    let bestFactions: {
        faction: FactionName,
        workType: FactionWorkType
    }[] = []
    let bestExperience: number;
    
    const factions = getFactions(ns)
        .flatMap(faction => Array.from(Object.values(ns.singularity.getFactionWorkTypes(faction))).map(workType => {
            return {
                    faction: faction,
                    workType: workType
                }
        }));

    for (const faction of factions) {
        const currentExperience = ns.formulas.work.factionGains(ns.getPlayer(), faction.workType, ns.singularity.getFactionFavor(faction.faction))[type];
        if (bestExperience < currentExperience) {
            bestExperience = currentExperience;
            bestFactions = [faction]
        } else if (bestExperience === currentExperience) {
            bestFactions.push(faction)
        }
    }

    return bestFactions;
}

/**
 * 
 * @requires singularity
 * @param ns 
 * @returns 
 */
export function getBestCompanyWork(ns: NS, company: CompanyName): CompanyPositionInfo | undefined {
    return getAvailablePositions(ns, company)
        .sort((a,b) => a.salary - b.salary)
        .pop();
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
        const currentBestPosition: CompanyPositionInfo | undefined = getBestCompanyWork(ns, currentCompany);

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
