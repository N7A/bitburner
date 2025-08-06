export interface RamResourceExecution {
    getScript(): string[];
    isExecutionUsless(ns: NS): boolean;
}