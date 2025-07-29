export type ExecutionParameters = {
    hostname: string;
    nbThread: number;
    scripts: ScriptParameters[];
}
export type ScriptParameters = {
    scriptsFilepath: string;
    args: ScriptArg[];
    pid: number;
}
export enum ExecutionType {
    ONESHOT,
    RUNNER,
    FIT_RAM
}