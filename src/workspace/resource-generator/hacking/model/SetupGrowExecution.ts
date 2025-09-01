import * as Referentiel from 'workspace/referentiel'
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import { ExecutionRequest } from 'workspace/load-balancer/model/ExecutionServer';
import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest';
import * as Log from 'workspace/socle/utils/logging';
import { Dashboard } from 'workspace/socle/interface/dashboard';

//#region Constants
export const GROW_SCRIPT = Referentiel.CMD_HACKING_DIRECTORY + '/payload/grow.daemon.ts';
//#endregion Constants

export class SetupGrowExecution implements RamResourceExecution {
    private executionRequest: ExecutionRequest;
    private targetHost: string;
    request: ProcessRequest;
    private nbThread: number;
    private dashboard: Dashboard;

    constructor(ns: NS, request: ProcessRequest, nbThread: number) {
        this.targetHost = request.target;
        this.request = request;
        this.nbThread = nbThread;
    
        this.executionRequest = {
            wantedThreadNumber: nbThread,
            scripts: [{scriptsFilepath: GROW_SCRIPT, args: [this.targetHost, false]}]
        };
        this.dashboard = new Dashboard(ns, 'Grow Setup', {role: 'looper', hostSource: this.targetHost});
    }
    
    getActionLog(): string {
        return `${Log.action('Grow Setup')} ${this.request.target ? Log.target(this.request.target) + ' ': ''}`;
    }

    getExecutionRequest(): ExecutionRequest {
        return this.executionRequest;
    }

    isExecutionUsless(): boolean {
        return this.nbThread <= 0;
    }
    
    setupDashboard() {
        // TODO: set pid
        this.dashboard.initTailTitle();
    }
}