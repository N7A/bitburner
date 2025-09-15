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

    type AutocompleteConfig = [string, string | number | boolean | string[]][];

    interface AutocompleteData {
        servers: string[],
        txts: string[],
        scripts: string[],
        flags: (config: AutocompleteConfig) => any
    }
}