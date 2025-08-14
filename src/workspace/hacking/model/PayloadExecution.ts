import * as Referentiel from 'workspace/referentiel'
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import {ServerData, HackData} from 'workspace/domain/servers/model/ServerData'
import { ServersRepository } from 'workspace/domain/servers/servers.repository';
import * as ExecutionsRepository from 'workspace/domain/executions/executions.repository'
import { ProcessRequest, ProcessRequestType } from 'workspace/domain/executions/model/ProcessRequest';
import { ExecutionRequest } from 'workspace/load-balancer/model/ExecutionServer';
import * as Log from 'workspace/frameworks/logging';

//#region Constants
export const HACK_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/hack.looper.ts';
export const WEAKEN_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/weaken.looper.ts';
export const GROW_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/grow.looper.ts';
//#endregion Constants

export class PayloadExecution implements RamResourceExecution {
    private executionRequest: ExecutionRequest;
    private targetHost: string;
    request: ProcessRequest;

    constructor(ns: NS, request: ProcessRequest) {
        this.request = request;
        this.targetHost = request.target;
    
        // load host data
        const data: ServerData|null = ServersRepository.get(ns, this.targetHost);
        const hackData: HackData = data!.hackData;
    
        let scripts = [];
        scripts.push({scriptsFilepath: HACK_SCRIPT, args: [this.targetHost]});
        scripts.push({scriptsFilepath: WEAKEN_SCRIPT, args: [this.targetHost]});
    
        if (hackData.moneyMax === 0) {
            //ns.print('WARN', ' ', '[', this.targetHost, '] ', 'No money in there');
        } else {
            scripts.push({scriptsFilepath: GROW_SCRIPT, args: [this.targetHost]});
            scripts.push({scriptsFilepath: WEAKEN_SCRIPT, args: [this.targetHost]});
        }

        this.executionRequest = {
            scripts: scripts
        }
    }
    
    getActionLog(): string {
        return `${Log.action('Hacking')} ${this.request.target ? Log.target(this.request.target) + ' ': ''}`;
    }

    getExecutionRequest(): ExecutionRequest {
        // TODO : check if payload already running
        //ns.getRunningScript(Properties.HACKING_DIRECTORY + '/payload/hack.looper.ts', targetHost)
        //ns.getRunningScript(Properties.HACKING_DIRECTORY + '/payload/hack.looper.ts', 'home', targetHost)
        
        // TODO : split nb thread (plutot que nb RAM) <- pour que le grow et weaken aient la force pour soutenir le hack
        // TODO : dynamique répartition : hack then weaken then grow then weaken then repeate
        // TODO : weaken thread nb >= grow + hack thread nb; grow thread nb >= hack thread nb
        return this.executionRequest;
    }

    isExecutionUsless(ns: NS): boolean {
        return ExecutionsRepository.getAll(ns).some(x => x.target === this.targetHost && x.type === ProcessRequestType.SETUP_HACK);
    }
    
    setupDashboard(ns: NS, pid: number, targetHost: string) {        
        Log.initTailTitle(ns, 'Hack', 'looper', targetHost, pid);
    }
}