import * as Referentiel from 'workspace/referentiel'
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import { ServerData } from 'workspace/servers/domain/model/ServerData'
import { HackData } from 'workspace/servers/domain/model/HackData'
import { ServersRepository } from 'workspace/servers/domain/servers.repository';
import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest';
import { ProcessRequestType } from 'workspace/load-balancer/domain/model/ProcessRequestType';
import { ExecutionRequest } from 'workspace/load-balancer/model/ExecutionServer';
import * as Log from 'workspace/socle/utils/logging';
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'

//#region Constants
export const HACK_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/hack.daemon.ts';
export const WEAKEN_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/weaken.daemon.ts';
export const GROW_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/grow.daemon.ts';
//#endregion Constants

export class PayloadExecution implements RamResourceExecution {
    private executionRequest: ExecutionRequest;
    private targetHost: string;
    request: ProcessRequest;

    constructor(ns: NS, request: ProcessRequest) {
        this.request = request;
        this.targetHost = request.target;
    
        const serversRepository = new ServersRepository(ns);
        // load host data
        const data: ServerData|null = serversRepository.get(this.targetHost);
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
        //ns.getRunningScript(Properties.HACKING_DIRECTORY + '/payload/hack.daemon.ts', targetHost)
        //ns.getRunningScript(Properties.HACKING_DIRECTORY + '/payload/hack.daemon.ts', 'home', targetHost)
        
        // TODO : split nb thread (plutot que nb RAM) <- pour que le grow et weaken aient la force pour soutenir le hack
        // TODO : dynamique répartition : hack then weaken then grow then weaken then repeate
        // TODO : weaken thread nb >= grow + hack thread nb; grow thread nb >= hack thread nb
        return this.executionRequest;
    }

    isExecutionUsless(ns: NS): boolean {
        const executionsRepository = new ExecutionsRepository(ns);

        return executionsRepository.getAll().some(x => x.target === this.targetHost && x.type === ProcessRequestType.SETUP_HACK) 
        /*|| (ns.getServer(this.targetHost).moneyAvailable ?? 0) <= (ns.getServer(this.targetHost).moneyMax ?? 0) * 0.5*/;
    }
    
    setupDashboard(ns: NS, pid: number, targetHost: string) {        
        Log.initTailTitle(ns, 'Hack', 'looper', targetHost, pid);
    }
}