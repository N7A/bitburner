import { ProcessRequest } from "workspace/load-balancer/domain/model/ProcessRequest";

// TODO : rename daemon execution ?
export interface RamResourceExecution {
    request: ProcessRequest;
    isExecutionUsless(ns: NS): Promise<boolean>;
    getActionLog(): string;
    setupDashboard(ns: NS, pid: number, targetHost: string): void;
    // TODO : getRamByThread
}