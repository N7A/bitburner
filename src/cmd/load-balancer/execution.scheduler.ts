import {ProcessRequest} from 'workspace/load-balancer/domain/model/ProcessRequest'
import { ServersService } from 'workspace/servers/servers.service';
import * as Referentiel from 'workspace/common/referentiel'
import {ExecutionOrder} from 'workspace/load-balancer/model/ExecutionServer'
import * as Log from 'workspace/socle/utils/logging';
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import { Logger } from 'workspace/socle/Logger';
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'
import { waitEndExecution } from 'workspace/socle/utils/execution';
import { ExecutionSelector } from 'workspace/load-balancer/execution-server.selector';
import { ExecutionOrdersService } from 'workspace/load-balancer/execution-orders.service';
import { Daemon } from 'workspace/socle/interface/daemon';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { PiggyBankRepository } from 'workspace/piggy-bank/domain/piggy-bank.repository';
import { ProcessRequestType } from 'workspace/load-balancer/domain/model/ProcessRequestType';
import { ShareRamExecution } from 'workspace/resource-generator/faction/model/ShareRamExecution';
import { OneShotExecution } from 'workspace/load-balancer/model/OneShotExecution';
import { PayloadExecution } from 'workspace/resource-generator/hacking/model/PayloadExecution';
import { SetupHackExecution } from 'workspace/resource-generator/hacking/model/SetupExecution';
import { getHashFromContent } from 'workspace/socle/utils/file';
import { DaemonFlags } from 'workspace/common/model/DaemonFlags';

//#region Constantes
const FLAGS_SCHEMA: [string, string | number | boolean | string[]][] = [
    [DaemonFlags.oneshot, false]
];
//#endregion Constantes

export async function main(ns: NS) {
    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);

    const daemon: ExecutionSchedulerDaemon = new ExecutionSchedulerDaemon(ns);
    
    ns.atExit(async () => {
        await daemon.resetAllRunningProcess();
    });
    
    daemon.setupDashboard();

    if (scriptFlags[DaemonFlags.oneshot]) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();
    
    ns.ui.closeTail();
}

class ExecutionSchedulerDaemon extends Daemon {
	private logger: Logger
    private orders: RamResourceExecution[] = [];
    private executionOrdersService: ExecutionOrdersService;
    private serversService: ServersService;
    private dashboard: Dashboard;
    private piggyBankRepository: PiggyBankRepository;

    constructor(ns: NS) {
        super(ns);
        
		this.logger = new Logger(ns);
        this.piggyBankRepository = new PiggyBankRepository(ns);
        this.executionOrdersService = new ExecutionOrdersService(ns);
        this.serversService = new ServersService(ns);
        this.dashboard = new Dashboard(ns, 'Executions', {icon: '⚖️▶️', role: 'Scheduler'});
    }

    async work(): Promise<any> {
        //ns.clearLog();
        this.logger.log('Waiting request modification...');
        // wait until orders change
        await this.waitContextChange();

        // TODO : dont kill hack and setup
        // kill all old for recalcul repartition
        await this.resetAllRunningProcess();
        // maj orders
        this.orders = await this.getExecutionOrders();

        this.logger.log(Log.action('Define servers repartion'));
        // define servers repartion
        const executions: Map<RamResourceExecution, ExecutionOrder[]> = await new ExecutionSelector(this.ns, this.orders).getRepartitions();

        this.logger.log(Log.action('Executions'), ` (${executions.size})`);
        // lancement des scripts
        for (const process of Array.from(executions.keys())) {
            let currentExecutionOrders = executions.get(process)
            if (!currentExecutionOrders) {
                continue;
            }
            for(const executionOrder of currentExecutionOrders) {
                const pid: number = await this.execute(executionOrder);
                if (pid === 0) {
                    continue;
                }
                
                if (process.request.request.wantedThreadNumber !== undefined) {
                    // maj thread number wanted
                    process.request.request.wantedThreadNumber = Math.max(process.request.request.wantedThreadNumber - executionOrder.nbThread, 0);
                }
                
                // TODO : setup dashboard, pour reduire au minimum la ram
                /*pids.filter(x => x !==0)
                    .forEach(x => {
                        process.setupDashboard(this.ns, x, executionOrder.sourceHostname);
                    })*/
                this.logger.log(`${process.getActionLog()} ${this.ns.formatNumber(executionOrder.nbThread, 0)} threads on ${Log.source(executionOrder.sourceHostname)}`);
                // maj pid processes
                process.request.pid = [...(process.request.pid ?? []), pid];
            }
            await this.executionOrdersService.save(process.request);
        }
    }
    
    async resetAllRunningProcess() {
        for (const request of this.orders.map(x => x.request)) {
            await this.resetRunningProcess(request);
        }
    }
    
    getId = (request: RamResourceExecution) => ExecutionsRepository.getHash(request.request);
    getHash(requests: RamResourceExecution[]) {
        return getHashFromContent(JSON.stringify(requests.map(x => this.getId(x)).sort()))
    }
    
    /**
     * Wait process orders or available ram change.
     * @param ns 
     * @returns new process orders
     */
    private async waitContextChange(): Promise<void> {
        const requests: RamResourceExecution[] = this.orders;
        const ramDisponible = this.serversService.getAllExecutable()
                .map(x => this.ns.getServerMaxRam(x))
                .reduce((a,b) => a+b);
        const ramBank: number = this.piggyBankRepository.getHash();

        let newRequest: RamResourceExecution[];
        let newRamDisponible: number;
        let newRamBank: number;
        
        do {
            await this.ns.asleep(500);

            newRamDisponible = this.serversService.getAllExecutable()
                .map(x => this.ns.getServerMaxRam(x))
                .reduce((a,b) => a+b);

            // TODO: gestion remove from orders manual killed or script KO 
            // TODO: alert ?
            // this.ns.print('Execution order killed : ', killedOrders.map(x => x.request.type + ' ' + x.request.target));

            // thread execution ended
            const killedOrders: RamResourceExecution[] = requests
                .filter(x => x.request.request.wantedThreadNumber !== undefined)
                .filter(x => x.request.pid?.every(y => !this.ns.isRunning(y)));
            if (killedOrders.length > 0) {
                killedOrders.filter(x => x.request.request.wantedThreadNumber <= 0)
                    .forEach(x => this.executionOrdersService.remove(x.request));
                break;
            }
            
            newRequest = await this.getExecutionOrders();

            newRamBank = this.piggyBankRepository.getHash();
        } while (
            // requetes inchangées
            /*Array.from(new Set([...requests.map(x => getId(x)), ...newRequest.map(x => getId(x))]))
                .every(x => newRequest.map(x => getId(x)).includes(x) && requests.map(x => getId(x)).includes(x))*/
            this.getHash(requests) === this.getHash(newRequest)
            // RAM inchangée
            && newRamDisponible === ramDisponible
            // valeurs du piggy-bank inchangée
            && newRamBank === ramBank
        )
    }

    async getExecutionOrders() {
        const executions: ProcessRequest[] = await this.executionOrdersService.getAll();

        const executionsOrder = executions
            .map(order => {
                if (order.type === ProcessRequestType.SHARE_RAM) {
                    return new ShareRamExecution(this.ns, order);
                } else if (order.type === ProcessRequestType.HACK) {
                    return new PayloadExecution(this.ns, order);
                } else if (order.type === ProcessRequestType.SETUP_HACK) {
                    return new SetupHackExecution(this.ns, order);
                } else if (order.type === ProcessRequestType.ONESHOT) {
                    return new OneShotExecution(this.ns, order);
                }
                return null;
            })
            .filter(x => x !== null)
            .map(x => x as RamResourceExecution);

        let result = [];
        for (const executionOrder of executionsOrder) {
            const isUseful = !(await executionOrder?.isExecutionUsless());
            if (isUseful) {
                result.push(executionOrder)
            }
        }
        return result
    }
    
    /**
     * Kill all process linked with process request, then clear pid on repository.
     * @param ns 
     * @param request process request to reset
     */
    private async resetRunningProcess(request: ProcessRequest) {
        // kill all process
        request.pid?.filter(x => x !== undefined).forEach(x => this.ns.kill(x));
        
        // ignore si plus en base
        if (!(await this.executionOrdersService.getAll()).some(x => {
            return ExecutionsRepository.getHash(request) === ExecutionsRepository.getHash(x)
        })) {
            return;
        }
        
        // reset all repository pid
        request.pid = [];
        await this.executionOrdersService.save(request);
    }

    //#region Execution
    async execute(executionOrder: ExecutionOrder): Promise<number> {
        if (executionOrder.nbThread === 0) {
            return 0;
        }

        // setup
        if (!this.ns.fileExists(executionOrder.request.scriptsFilepath, executionOrder.sourceHostname)) {
            this.logger.warn(`Script ${executionOrder.request.scriptsFilepath} inexistant sur ${executionOrder.sourceHostname}`);
            const copyPid = this.ns.run(Referentiel.HACKING_DIRECTORY + '/spreading/copy-toolkit.worker.ts', 1, executionOrder.sourceHostname);
            
            await waitEndExecution(this.ns, copyPid);
        }

        return this.ns.exec(
            executionOrder.request.scriptsFilepath, 
            executionOrder.sourceHostname, 
            {threads: executionOrder.nbThread, temporary: true}, 
            ...executionOrder.request.args ?? []
        );
    }
    //#endregion Execution

    //#region Dashboard
    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
        
        this.dashboard.initTailTitle();
        this.ns.ui.openTail();
    }
    //#endregion Dashboard
}