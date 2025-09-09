import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest';
import { SgbdDaemon } from "workspace/socle/database/sgbd.handler";
import { CommitRequest } from "workspace/socle/database/model/CommitRequest";
import { CommitType } from "workspace/socle/database/model/CommitType";
import { Repository } from "workspace/socle/database/model/Repository";

export class ExecutionOrdersService {
    private ns: NS;

    /**
     * 
     * @param ns Bitburner API
     */
    constructor(ns: NS) {
        this.ns = ns;
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