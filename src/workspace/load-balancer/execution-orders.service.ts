import { ProcessRequestType } from "workspace/load-balancer/domain/model/ProcessRequestType";
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import { ShareRamExecution } from 'workspace/resource-generator/faction/model/ShareRamExecution'
import { PayloadExecution } from 'workspace/resource-generator/hacking/model/PayloadExecution'
import { SetupHackExecution } from 'workspace/resource-generator/hacking/model/SetupExecution';
import { OneShotExecution } from 'workspace/load-balancer/model/OneShotExecution';

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
    
}