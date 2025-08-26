import * as bitburner from "./NetscriptDefinitions";

export { };

declare global {
    
    interface NS extends bitburner.NS {}
    interface GangTaskStats extends bitburner.GangTaskStats {}
    interface Server extends bitburner.Server {}
    interface NodeStats extends bitburner.NodeStats {}
    interface ProcessInfo extends bitburner.ProcessInfo {}

    type AutocompleteConfig = [string, string | number | boolean | string[]][];

    interface AutocompleteData {
        servers: string[],
        txts: string[],
        scripts: string[],
        flags: (config: AutocompleteConfig) => any
    }
}