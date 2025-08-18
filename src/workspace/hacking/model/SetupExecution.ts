import * as Referentiel from 'workspace/referentiel'
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import {ServerData, HackData} from 'workspace/domain/servers/model/ServerData'
import { ServersRepository } from 'workspace/domain/servers/servers.repository';
import { ExecutionRequest } from 'workspace/load-balancer/model/ExecutionServer';
import { ProcessRequest } from 'workspace/domain/executions/model/ProcessRequest';
import * as Log from 'workspace/frameworks/logging';

//#region Constants
export const SETUP_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/setup-server.sequencer.ts';
//#endregion Constants

export class SetupExecution implements RamResourceExecution {
    private executionRequest: ExecutionRequest;
    private targetHost: string;
    request: ProcessRequest;

    constructor(request: ProcessRequest) {
        this.targetHost = request.target;
        this.request = request;
    
        this.executionRequest = {
            wantedThreadNumber: 1,
            scripts: [{scriptsFilepath: SETUP_SCRIPT, args: [this.targetHost]}]
        };
    }
    
    getActionLog(): string {
        return `${Log.action('Setup')} ${this.request.target ? Log.target(this.request.target) + ' ': ''}`;
    }

    getExecutionRequest(): ExecutionRequest {
        return this.executionRequest;
    }

    isExecutionUsless(ns: NS): boolean {
        // load host data
        const data: ServerData|null = ServersRepository.get(ns, this.targetHost);
        const hackData: HackData = data!.hackData;
        return ns.getServer(this.targetHost).hackDifficulty <= hackData.minDifficulty
            && ns.getServer(this.targetHost).moneyAvailable >= hackData.moneyMax
    }
    
    setupDashboard(ns: NS, pid: number, targetHost: string) {        
        Log.initTailTitle(ns, 'Setup', 'looper', targetHost, pid);
    }
}