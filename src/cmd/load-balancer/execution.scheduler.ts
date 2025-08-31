import {ProcessRequest} from 'workspace/load-balancer/domain/model/ProcessRequest'
import { ServersService } from 'workspace/servers/servers.service';
import * as Referentiel from 'workspace/referentiel'
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

export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);

    const daemon: ExecutionSchedulerDaemon = new ExecutionSchedulerDaemon(ns);
    
    ns.atExit(() => {
        daemon.resetAllRunningProcess();
    });
    
    daemon.setupDashboard();

    if (!input.runHasLoop) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();
    
    ns.ui.closeTail();
}

//#region Input arguments
type InputArg = {
    /** Serveur cible */
    runHasLoop: boolean;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
    return {
        runHasLoop: ns.args[0] !== undefined ? (ns.args[0] as boolean) : true
    };
}
//#endregion Input arguments

class ExecutionSchedulerDaemon extends Daemon {
    private orders: RamResourceExecution[] = [];
    private executionsRepository: ExecutionsRepository;
    private executionOrdersService: ExecutionOrdersService;
    private serversService: ServersService;
    private dashboard: Dashboard;
    private piggyBankRepository: PiggyBankRepository;

    constructor(ns: NS) {
        super(ns);
        
        this.piggyBankRepository = new PiggyBankRepository(ns);
        this.executionsRepository = new ExecutionsRepository(ns);
        this.executionOrdersService = new ExecutionOrdersService(ns);
        this.serversService = new ServersService(ns);
        this.dashboard = new Dashboard(ns, 'Executions', {icon: '⚖️▶️', role: 'Scheduler'});
    }

    async work(): Promise<any> {
        //ns.clearLog();
        this.ns.print('Waiting request modification...');
        // wait until orders change
        await this.waitContextChange();

        // TODO : dont kill hack and setup
        // kill all old for recalcul repartition
        this.resetAllRunningProcess();
        // maj orders
        this.orders = this.executionOrdersService.getExecutionOrders();

        this.ns.print(Log.action('Define servers repartion'));
        // define servers repartion
        const executions: Map<RamResourceExecution, ExecutionOrder[]> = await new ExecutionSelector(this.ns, this.orders).getRepartitions();

        this.ns.print(Log.action('Executions'), ` (${executions.size})`);
        // lancement des scripts
        for (const process of executions.keys()) {
            let currentExecutionOrders = executions.get(process)
            if (!currentExecutionOrders) {
                continue;
            }
            for(const executionOrder of currentExecutionOrders) {
                const pids = await this.execute(executionOrder);
                if (process.request.wantedThreadNumber !== undefined) {
                    // maj thread number wanted
                    process.request.wantedThreadNumber = Math.max(process.request.wantedThreadNumber - executionOrder.nbThread, 0);
                }
                
                // TODO : setup dashboard, pour reduire au minimum la ram
                pids.filter(x => x !==0)
                    .forEach(x => {
                        process.setupDashboard(this.ns, x, executionOrder.sourceHostname);
                    })
                this.ns.print(`${process.getActionLog()} ${this.ns.formatNumber(executionOrder.nbThread, 0)} threads on ${Log.source(executionOrder.sourceHostname)}`);
                // maj pid processes
                process.request.pid = [...(process.request.pid ?? []), ...pids];
            }
            this.executionsRepository.save(process.request);
        }
    }
    
    resetAllRunningProcess() {
        this.orders.map(x => x.request).forEach(x => this.resetRunningProcess(x));
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

        const getId = (request: RamResourceExecution) => request.request.type + (request.request.target ?? '');

        let newRequest: RamResourceExecution[];
        let newRamDisponible: number;
        let newRamBank: number;
        
        do {
            await this.ns.sleep(500);

            newRamDisponible = this.serversService.getAllExecutable()
                .map(x => this.ns.getServerMaxRam(x))
                .reduce((a,b) => a+b);

            // TODO: gestion remove from orders manual killed or script KO 
            // TODO: alert ?
            // this.ns.print('Execution order killed : ', killedOrders.map(x => x.request.type + ' ' + x.request.target));

            // thread execution ended
            const killedOrders: RamResourceExecution[] = requests
                .filter(x => x.getExecutionRequest().wantedThreadNumber !== undefined)
                .filter(x => x.request.pid?.every(y => !this.ns.isRunning(y)));
            if (killedOrders.length > 0) {
                killedOrders.filter(x => x.getExecutionRequest().wantedThreadNumber <= 0)
                    .forEach(x => this.executionsRepository.remove(x.request));
                break;
            }
            
            newRequest = this.executionOrdersService.getExecutionOrders();

            newRamBank = this.piggyBankRepository.getHash();
        } while (
            // requetes inchangées
            Array.from(new Set([...requests.map(x => getId(x)), ...newRequest.map(x => getId(x))]))
                .every(x => newRequest.map(x => getId(x)).includes(x) && requests.map(x => getId(x)).includes(x))
            // RAM inchangée
            && newRamDisponible === ramDisponible
            // valeurs du piggy-bank inchangée
            && newRamBank === ramBank
        )
    }

    /**
     * Kill all process linked with process request, then clear pid on repository.
     * @param ns 
     * @param request process request to reset
     */
    private resetRunningProcess(request: ProcessRequest) {
        // kill all process
        request.pid?.filter(x => x !== undefined).forEach(x => this.ns.kill(x));
        // reset all repository pid
        request.pid = [];
        this.executionsRepository.save(request)
    }

    //#region Execution
    async execute(executionOrder: ExecutionOrder): Promise<number[]> {
        const logger = new Logger(this.ns);
        let pids: number[] = []
        if (executionOrder.nbThread === 0) {
            return pids;
        }

        for (const script of executionOrder.request.scripts) {
            // setup
            if (!this.ns.fileExists(script.scriptsFilepath, executionOrder.sourceHostname)) {
                logger.warn(`Script ${script.scriptsFilepath} inexistant sur ${executionOrder.sourceHostname}`);
                const copyPid = this.ns.run(Referentiel.HACKING_DIRECTORY + '/spreading/copy-toolkit.worker.ts', 1, executionOrder.sourceHostname);
                
                await waitEndExecution(this.ns, copyPid);
            }

            const executionPid: number = this.ns.exec(script.scriptsFilepath, executionOrder.sourceHostname, executionOrder.nbThread, ...script.args ?? []);
            pids.push(executionPid);

            // TODO : reflechir à comment traiter le cas
            if (executionPid === 0) {
                return pids;
            }
        }

        return pids;
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