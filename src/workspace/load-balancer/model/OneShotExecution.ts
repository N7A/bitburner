import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest';
import * as Log from 'workspace/socle/utils/logging';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';

export class OneShotExecution implements RamResourceExecution{
    private targetHost: string;
    request: ProcessRequest;
    private dashboard: Dashboard;

    constructor(ns: NS, request: ProcessRequest) {
        this.targetHost = request.id;
        this.request = request;
    
        this.dashboard = new Dashboard(ns, request.label, {role: 'worker', hostSource: this.targetHost});
    }
    
    getActionLog(): string {
        return `${Log.action(this.request.label)} ${this.request.id ? Log.target(this.request.id) + ' ': ''}`;
    }

    isExecutionUsless(): boolean {
        return false;
    }
    
    setupDashboard() {
        // TODO: set pid
        this.dashboard.initTailTitle();
    }
}