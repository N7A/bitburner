import * as Referentiel from 'workspace/common/referentiel';
import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest';
import { JsonRepository } from 'workspace/socle/interface/json-repository';
import { getHashFromContent } from 'workspace/socle/utils/file';

export class ExecutionsRepository extends JsonRepository<ProcessRequest> {

    constructor(ns: NS) {
        super(ns);

        this.REPOSITORY = Referentiel.EXECUTION_ORDERS_REPOSITORY;
    }

    /**
     * Supprime une execution de la base de données.
     * 
     * @param ns Bitburner API
     * @param execution execution à mettre à jour
     * 
     * @remarks Ram cost : 0.1 GB
     */
    save(execution: ProcessRequest) {
        this.logger.trace(`To save : ${JSON.stringify(execution, null, 4)}`);
        
        // get last version of executions
        let executions: ProcessRequest[] = this.getAll();

        // remove execution
        executions = executions.filter(x => {
            return ExecutionsRepository.getHash(execution) !== ExecutionsRepository.getHash(x)
        });
        executions.push(execution);

        // save data
        this.resetWith(executions);
    }

    /**
     * Supprime une execution de la base de données.
     * 
     * @param ns Bitburner API
     * @param executionToRemove execution à supprimer
     * 
     * @remarks Ram cost : 0.1 GB
     */
    remove(executionToRemove: ProcessRequest) {
        this.logger.trace(`To remove : ${JSON.stringify(executionToRemove, null, 4)}`);

        // get last version of executions
        let executions: ProcessRequest[] = this.getAll();

        const removed = executions.filter(execution => {
            return ExecutionsRepository.getHash(execution) === ExecutionsRepository.getHash(executionToRemove)
        })
        this.logger.trace(`Removed : ${JSON.stringify(removed, null, 4)}`)

        // remove execution
        executions = executions.filter(execution => {
            return ExecutionsRepository.getHash(execution) !== ExecutionsRepository.getHash(executionToRemove)
        });
        
        this.logger.trace(`Removed lines ${removed.length}`)

        // save data
        this.resetWith(executions);
    }
    
    clearPid() {
        // get last version of executions
        let executions: ProcessRequest[] = this.getAll();

        executions.forEach(element => {
            element.pid?.filter(x => x !== undefined).forEach(x => this.ns.kill(x));
            element.pid = [];
        });
        
        // save data
        this.resetWith(executions);
    }

    static getHash(order: ProcessRequest) {
        return getHashFromContent(JSON.stringify({
            type: order.type,
            id: order.id,
            request: {
                scripts: order.request?.scripts
            }
        } as ProcessRequest))
    }
}
