import * as bitburner from "./NetscriptDefinitions";

export { };

declare global {
    
    interface NS extends bitburner.NS {}
    interface GangTaskStats extends bitburner.GangTaskStats {}
    interface GangGenInfo extends bitburner.GangGenInfo {}
    interface GangMemberAscension extends bitburner.GangMemberAscension {}
    interface Server extends bitburner.Server {}
    interface NodeStats extends bitburner.NodeStats {}
    interface ProcessInfo extends bitburner.ProcessInfo {}
    type ScriptArg = bitburner.ScriptArg
    type RunningScript = bitburner.RunningScript
    type CrimeStats = bitburner.CrimeStats
    type CrimeType = bitburner.CrimeType
    type MoneyRequirement = bitburner.MoneyRequirement
    type CompanyName = bitburner.CompanyName
    type CompanyPositionInfo = bitburner.CompanyPositionInfo
    type CompanyWorkTask = bitburner.CompanyWorkTask
    type LocationName = bitburner.LocationName
    type ILocation = bitburner.ILocation
    type InfiltrationLocation = bitburner.InfiltrationLocation
    type CityName = bitburner.CityName
    type CodingContractObject = bitburner.CodingContractObject
    type CodingContractName = bitburner.CodingContractName
    type Player = bitburner.Player
    interface WorkStats extends bitburner.WorkStats {}

    enum UniversityClassType {
        computerScience = "Computer Science",
        dataStructures = "Data Structures",
        networks = "Networks",
        algorithms = "Algorithms",
        management = "Management",
        leadership = "Leadership",
    }

    enum UniversityLocationName {
      AevumSummitUniversity = "Summit University",
      Sector12RothmanUniversity = "Rothman University",
      VolhavenZBInstituteOfTechnology = "ZB Institute of Technology",
    }

    enum GymLocationName {
        AevumCrushFitnessGym = "Crush Fitness Gym",
        AevumSnapFitnessGym = "Snap Fitness Gym",
        Sector12IronGym = "Iron Gym",
        Sector12PowerhouseGym = "Powerhouse Gym",
        VolhavenMilleniumFitnessGym = "Millenium Fitness Gym",
    }

    enum GymType {
        strength = "str",
        defense = "def",
        dexterity = "dex",
        agility = "agi",
    }

    type AutocompleteConfig = [string, string | number | boolean | string[]][];

    interface AutocompleteData {
        servers: string[],
        txts: string[],
        scripts: string[],
        flags: (config: AutocompleteConfig) => any
    }
}