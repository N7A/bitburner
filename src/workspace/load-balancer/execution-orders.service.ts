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
        return await SgbdDaemon.getResponse(this.ns);
    }
    
    async add(data: ProcessRequest) {
        await SgbdDaemon.pushData(this.ns, {
            repository: Repository.EXECUTIONS, 
            type: CommitType.ADD,
            data: data
        } as CommitRequest);
    }

    async save(execution: ProcessRequest) {
        await SgbdDaemon.pushData(this.ns, {
            repository: Repository.EXECUTIONS, 
            type: CommitType.SAVE,
            data: execution
        } as CommitRequest);
    }
    
    async remove(executionToRemove: ProcessRequest) {
        await SgbdDaemon.pushData(this.ns, {
            repository: Repository.EXECUTIONS, 
            type: CommitType.REMOVE,
            data: executionToRemove
        } as CommitRequest);
    }

    async reset(data?: ProcessRequest[]) {
        await SgbdDaemon.pushData(this.ns, {
            repository: Repository.EXECUTIONS, 
            type: CommitType.RESET,
            data: data
        } as CommitRequest);
    }
}