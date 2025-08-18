import { ExecutionRequest } from "workspace/load-balancer/model/ExecutionServer";
import { ProcessRequest } from "workspace/domain/executions/model/ProcessRequest";

// TODO : rename daemon execution ?
export interface RamResourceExecution {
    request: ProcessRequest;
    // TODO : only worker (run loop)
    getExecutionRequest(): ExecutionRequest;
    isExecutionUsless(ns: NS): boolean;
    getActionLog(): string;
    setupDashboard(ns: NS, pid: number, targetHost: string): void;
    // TODO : getRamByThread
}