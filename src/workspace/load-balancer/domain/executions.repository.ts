import * as Referentiel from 'workspace/referentiel';
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
        // get last version of executions
        let executions: ProcessRequest[] = this.getAll();

        const countLine = executions.filter(execution => {
            return ExecutionsRepository.getHash(execution) === ExecutionsRepository.getHash(executionToRemove)
        }).length
        // remove execution
        executions = executions.filter(execution => {
            return ExecutionsRepository.getHash(execution) !== ExecutionsRepository.getHash(executionToRemove)
        });
        this.ns.print(`Removed lines ${countLine}`)

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
