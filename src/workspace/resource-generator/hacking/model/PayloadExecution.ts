import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest';
import { ProcessRequestType } from 'workspace/load-balancer/domain/model/ProcessRequestType';
import * as Log from 'workspace/socle/utils/logging';
import { ExecutionOrdersService } from 'workspace/load-balancer/execution-orders.service';
import { SetupHackExecution } from 'workspace/resource-generator/hacking/model/SetupExecution';
import { ServerData } from 'workspace/servers/domain/model/ServerData'
import { HackData } from 'workspace/servers/domain/model/HackData'
import * as Referentiel from 'workspace/common/referentiel'
import { ServersRepository } from 'workspace/servers/domain/servers.repository';
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository';
import { Dashboard } from 'workspace/socle/interface/dashboard';

export class PayloadExecution implements RamResourceExecution {
    //#region Constants
    static readonly HACK_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/hack.daemon.ts';
    static readonly WEAKEN_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/weaken.daemon.ts';
    static readonly GROW_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/grow.daemon.ts';
    //#endregion Constants

    private dashboard: Dashboard;
    private targetHostname: string;
    request: ProcessRequest;
    private executionOrdersService: ExecutionOrdersService;

    constructor(ns: NS, request: ProcessRequest) {
        this.request = request;
        this.targetHostname = request.id;
        this.executionOrdersService = new ExecutionOrdersService(ns);
        this.dashboard = new Dashboard(ns, `Hack ${Log.target(this.targetHostname, {colorless: true})}`, {icon: '👨🏻‍💻💲', role: 'looper'});
    }

    async isExecutionUsless(): Promise<boolean> {
        // TODO : check if payload already running
        //ns.getRunningScript(Properties.HACKING_DIRECTORY + '/payload/hack.daemon.ts', targetHost)
        //ns.getRunningScript(Properties.HACKING_DIRECTORY + '/payload/hack.daemon.ts', 'home', targetHost)

        const setupRequest = SetupHackExecution.getRequest(this.targetHostname);
        return (await this.executionOrdersService.getAll())
            .some(x => ExecutionsRepository.getHash(setupRequest) === ExecutionsRepository.getHash(x))
        /*|| (ns.getServer(this.targetHost).moneyAvailable ?? 0) <= (ns.getServer(this.targetHost).moneyMax ?? 0) * 0.5*/;
    }
    
    getActionLog(): string {
        return `${Log.action('Hacking')} ${Log.target(this.targetHostname)}`;
    }
    
    setupDashboard() {   
        this.dashboard.initTailTitle();
    }
    
    // TODO : split nb thread (plutot que nb RAM) <- pour que le grow et weaken aient la force pour soutenir le hack
    // TODO : dynamique répartition : hack then weaken then grow then weaken then repeate
    // TODO : weaken thread nb >= grow + hack thread nb; grow thread nb >= hack thread nb
    static getRequest(ns: NS, targetHostname: string): ProcessRequest {
        const serversRepository = new ServersRepository(ns);

        // load host data
        const data: ServerData|null = serversRepository.get(targetHostname);
        const hackData: HackData = data!.hackData;
    
        let scripts = [];
        scripts.push({scriptsFilepath: PayloadExecution.HACK_SCRIPT, args: [targetHostname]});
        scripts.push({scriptsFilepath: PayloadExecution.WEAKEN_SCRIPT, args: [targetHostname]});
    
        if (hackData.moneyMax === 0) {
            //ns.print('WARN', ' ', '[', this.targetHost, '] ', 'No money in there');
        } else {
            scripts.push({scriptsFilepath: PayloadExecution.GROW_SCRIPT, args: [targetHostname]});
            scripts.push({scriptsFilepath: PayloadExecution.WEAKEN_SCRIPT, args: [targetHostname]});
        }

        return {
            type: ProcessRequestType.HACK, 
            id: targetHostname,
            weight: 1,
            label: `${Log.action('Hacking')} ${Log.target(targetHostname)}`,
            request: {
                scripts: scripts
            }
        };
    }
}