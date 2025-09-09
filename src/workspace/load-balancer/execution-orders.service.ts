import { ProcessRequestType } from "workspace/load-balancer/domain/model/ProcessRequestType";
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import { ShareRamExecution } from 'workspace/resource-generator/faction/model/ShareRamExecution'
import { PayloadExecution } from 'workspace/resource-generator/hacking/model/PayloadExecution'
import { SetupHackExecution } from 'workspace/resource-generator/hacking/model/SetupExecution';
import { OneShotExecution } from 'workspace/load-balancer/model/OneShotExecution';
import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest';
import { SgbdDaemon } from "workspace/socle/database/sgbd.handler";
import { CommitRequest } from "workspace/socle/database/model/CommitRequest";
import { CommitType } from "workspace/socle/database/model/CommitType";
import { Repository } from "workspace/socle/database/model/Repository";

export class ExecutionOrdersService {
    private ns: NS;
    private repository: ExecutionsRepository;

    /**
     * 
     * @param ns Bitburner API
     */
    constructor(ns: NS) {
        this.ns = ns;
        this.repository = new ExecutionsRepository(ns);
    }
    
    getExecutionOrders() {
        return this.repository.getAll()
            .map(order => {
                if (order.type === ProcessRequestType.SHARE_RAM) {
                    return new ShareRamExecution(order);
                } else if (order.type === ProcessRequestType.HACK) {
                    return new PayloadExecution(this.ns, order);
                } else if (order.type === ProcessRequestType.SETUP_HACK) {
                    return new SetupHackExecution(order);
                } else if (order.type === ProcessRequestType.ONESHOT) {
                    return new OneShotExecution(this.ns, order);
                }
                return null;
            })
            .filter(x => x !== null)
            .map(x => x as RamResourceExecution)
            .filter((executionOrder: RamResourceExecution) => !executionOrder?.isExecutionUsless(this.ns));
    }
    
    async getAll(): Promise<ProcessRequest[]> {
        SgbdDaemon.pushData(this.ns, {
            repository: Repository.EXECUTIONS, 
            type: CommitType.GET_ALL
        } as CommitRequest);

        return await SgbdDaemon.getResponse(this.ns);
    }
    
    add(data: ProcessRequest) {
        SgbdDaemon.pushData(this.ns, {
            repository: Repository.EXECUTIONS, 
            type: CommitType.ADD,
            data: data
        } as CommitRequest);
    }

    save(execution: ProcessRequest) {
        SgbdDaemon.pushData(this.ns, {
            repository: Repository.EXECUTIONS, 
            type: CommitType.SAVE,
            data: execution
        } as CommitRequest);
    }
    
    remove(executionToRemove: ProcessRequest) {
        SgbdDaemon.pushData(this.ns, {
            repository: Repository.EXECUTIONS, 
            type: CommitType.REMOVE,
            data: executionToRemove
        } as CommitRequest);
    }

    reset() {
        SgbdDaemon.pushData(this.ns, {
            repository: Repository.EXECUTIONS, 
            type: CommitType.RESET
        } as CommitRequest);
    }
}