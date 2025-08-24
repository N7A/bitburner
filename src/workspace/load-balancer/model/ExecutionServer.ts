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

// TODO : one shot prio par rapport à looper (faire de la place niveau ram)
// une fois one shot exec, remove from order
export enum ExecutionType {
    // worker, launcher, setup
    ONESHOT,
    // ram resource, scheduler, worker
    RUNNER, // DAEMON // LOOPER
    FIT_RAM // not same layer
}