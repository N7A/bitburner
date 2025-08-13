export type ExecutionRequest = {
    wantedThreadNumber?: number;
    scripts: ScriptRequest[];
}

export type ScriptRequest = {
    scriptsFilepath: string;
    args?: ScriptArg[];
}

export type ExecutionOrder = {
    sourceHostname: string;
    nbThread: number;
    request: ExecutionRequest;
}

export enum ExecutionType {
    ONESHOT,
    RUNNER,
    FIT_RAM
}