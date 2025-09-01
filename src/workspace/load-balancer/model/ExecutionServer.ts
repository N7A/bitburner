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
    request: ScriptRequest;
}
