import * as Referentiel from 'workspace/referentiel';
import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest';
import { JsonRepository } from 'workspace/common/JsonRepository';

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
            return !(x.type === execution.type && x.target === execution.target)
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

        // remove execution
        executions = executions.filter(execution => {
            return (execution.type === executionToRemove.type && execution.target === executionToRemove.target)
        });

        // save data
        this.resetWith(executions);
    }
}
