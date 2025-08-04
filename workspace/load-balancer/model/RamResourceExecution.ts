export interface RamResourceExecution {
    readonly SCRIPTS: string[];
    isExecutionUsless(ns: NS): boolean;
}