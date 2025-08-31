import {ProcessRequest} from 'workspace/load-balancer/domain/model/ProcessRequest'
import { ServersService } from 'workspace/servers/servers.service';
import * as Referentiel from 'workspace/referentiel'
import {ExecutionOrder} from 'workspace/load-balancer/model/ExecutionServer'
import * as Log from 'workspace/socle/utils/logging';
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import { TerminalLogger } from 'workspace/socle/TerminalLogger';
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'
import { waitEndExecution } from 'workspace/socle/utils/execution';
import { getRepartitions } from 'workspace/load-balancer/execution-server.selector';
import { ExecutionOrdersService } from 'workspace/load-balancer/execution-orders.service';
import { Daemon } from 'workspace/socle/interface/daemon';

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

    constructor(ns: NS) {
        super(ns);

        this.executionsRepository = new ExecutionsRepository(ns);
        this.executionOrdersService = new ExecutionOrdersService(ns);
        this.serversService = new ServersService(ns);
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
        const executions: Map<RamResourceExecution, ExecutionOrder[]> = await getRepartitions(this.ns, this.orders);

        this.ns.print(Log.action('Executions'), ` (${executions.size})`);
        // lancement des scripts
        for (const process of executions.keys()) {
            let currentExecutionOrders = executions.get(process)
            if (!currentExecutionOrders) {
                continue;
            }
            for(const executionOrder of currentExecutionOrders) {
                const pids = await this.execute(executionOrder);
                
                // TODO : setup dashboard, pour reduire au minimum la ram
                pids.filter(x => x !==0)
                    .forEach(x => {
                        process.setupDashboard(this.ns, x, executionOrder.sourceHostname);
                    })
                this.ns.print(`${process.getActionLog()} ${this.ns.formatNumber(executionOrder.nbThread, 0)} threads on ${Log.source(executionOrder.sourceHostname)}`);
                // maj pid processes
                process.request.pid = [...(process.request.pid ?? []), ...pids];
            }
            this.executionsRepository.save(process.request)
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
        const requests: RamResourceExecution[] = this.executionOrdersService.getExecutionOrders();
        const ramDisponible = this.serversService.getAllExecutable()
                .map(x => this.ns.getServerMaxRam(x))
                //.map(x => availableRam(ns, x))
                .reduce((a,b) => a+b);

        const getId = (request: RamResourceExecution) => request.request.type + (request.request.target ?? '');

        let newRequest: RamResourceExecution[];
        let newRamDisponible: number;
        
        do {
            await this.ns.sleep(500);

            newRamDisponible = this.serversService.getAllExecutable()
                .map(x => this.ns.getServerMaxRam(x))
                //.map(x => availableRam(ns, x))
                .reduce((a,b) => a+b);

            // remove from orders manual killed or script KO 
            // TODO : alert ?
            /*const killedOrders: RamResourceExecution[] = requests.filter(x => x.request.pid?.some(y => !ns.isRunning(y)));
            if (killedOrders.length > 0) {
                killedOrders.forEach(x => ExecutionsRepository.remove(ns, x.request));
                ns.print('Execution order killed : ', killedOrders.map(x => x.request.type + ' ' + x.request.target));
                break;
            }*/
            
            newRequest = this.executionOrdersService.getExecutionOrders();
        } while (
            // requetes inchangées
            Array.from(new Set([...requests.map(x => getId(x)), ...newRequest.map(x => getId(x))]))
                .every(x => newRequest.map(x => getId(x)).includes(x) && requests.map(x => getId(x)).includes(x))
            // RAM inchangée
            && newRamDisponible === ramDisponible
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
        const logger = new TerminalLogger(this.ns);
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
        
        Log.initTailTitle(this.ns, 'Executions', 'Scheduler');
        this.ns.ui.openTail();
    }
    //#endregion Dashboard
}