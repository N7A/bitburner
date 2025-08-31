import * as Referentiel from 'workspace/referentiel'
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import { ExecutionRequest } from 'workspace/load-balancer/model/ExecutionServer';
import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest';
import * as Log from 'workspace/socle/utils/logging';

//#region Constants
export const WEAKEN_SCRIPT = Referentiel.CMD_HACKING_DIRECTORY + '/payload/weaken.daemon.ts';
//#endregion Constants

export class SetupExecution implements RamResourceExecution {
    private executionRequest: ExecutionRequest;
    private targetHost: string;
    request: ProcessRequest;
    private nbThread: number;

    constructor(request: ProcessRequest, nbThread: number) {
        this.targetHost = request.target;
        this.request = request;
        this.nbThread = nbThread;
    
        this.executionRequest = {
            wantedThreadNumber: nbThread,
            scripts: [{scriptsFilepath: WEAKEN_SCRIPT, args: [this.targetHost]}]
        };
    }
    
    getActionLog(): string {
        return `${Log.action('Weaken Setup')} ${this.request.target ? Log.target(this.request.target) + ' ': ''}`;
    }

    getExecutionRequest(): ExecutionRequest {
        return this.executionRequest;
    }

    isExecutionUsless(ns: NS): boolean {
        return this.nbThread === 0;
    }
    
    setupDashboard(ns: NS, pid: number, targetHost: string) {        
        Log.initTailTitle(ns, 'Weaken Setup', 'looper', targetHost, pid);
    }
}