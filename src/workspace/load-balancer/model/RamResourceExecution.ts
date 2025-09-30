import { ProcessRequest } from "workspace/load-balancer/domain/model/ProcessRequest";

// TODO : rename daemon execution ?
export interface RamResourceExecution {
    request: ProcessRequest;
    isExecutionUsless(): Promise<boolean>;
    getActionLog(): string;
    setupDashboard(): void;
    // TODO : getRamByThread
}