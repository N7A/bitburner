export type FitRamExecution = {
    scriptFilepath: string;
    hostname: string;
    args: ScriptArg[];
    pid: number;
}