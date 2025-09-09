import { Daemon } from 'workspace/socle/interface/daemon';
import { ExecutionsRepository } from 'workspace/load-balancer/domain/executions.repository'
import { CommitRequest } from "workspace/socle/database/model/CommitRequest";
import { CommitType } from "workspace/socle/database/model/CommitType";
import { Repository } from "workspace/socle/database/model/Repository";
import { Broker } from 'workspace/socle/utils/broker';

export async function main(ns: NS) {
    const daemon = new SgbdDaemon(ns);
    
    await daemon.run();
}

//#region Constants
const COMMIT_HANDLER_SCRIPT = "workspace/socle/database/sgbd.handler.ts";
//#endregion Constants

export class SgbdDaemon extends Daemon {
    //#region Constants
    static readonly REQUEST_PORT = 1;
    static readonly RESPONSE_PORT = 1;
    //#endregion Constants

    private executionsRepository: ExecutionsRepository;

    constructor(ns: NS) {
        super(ns);
            
        this.executionsRepository = new ExecutionsRepository(ns);
    }
    
    async work(): Promise<any> {
        if (this.ns.peek(SgbdDaemon.REQUEST_PORT) === 'NULL PORT DATA') {
            await this.ns.nextPortWrite(SgbdDaemon.REQUEST_PORT);
        }

        const commitRequest: CommitRequest = this.ns.readPort(SgbdDaemon.REQUEST_PORT);

        if (commitRequest.repository == Repository.EXECUTIONS) {
            this.handleExecutionRequest(commitRequest.data, commitRequest.type);
        }
    }

    handleExecutionRequest(data: any, type: CommitType) {
        if (type === CommitType.GET_ALL) {
            this.pushResponse(this.executionsRepository.getAll());
        } else if (type === CommitType.ADD) {
            this.executionsRepository.add(data);
        } else if (type === CommitType.SAVE) {
            this.executionsRepository.save(data);
        } else if (type === CommitType.REMOVE) {
            this.executionsRepository.remove(data);
        } else if (type === CommitType.RESET) {
            this.executionsRepository.reset();
        }
    }

    private async pushResponse(response: any) {
        while(!this.ns.tryWritePort(SgbdDaemon.RESPONSE_PORT, response)) {
            await this.ns.asleep(500);
        }
    }
    
    static async pushData(ns: NS, commitRequest: CommitRequest) {
        await Broker.pushData(ns, SgbdDaemon.REQUEST_PORT, commitRequest, COMMIT_HANDLER_SCRIPT);
    }
    
    static async getResponse(ns: NS): Promise<any> {
        return await Broker.getResponse(ns, SgbdDaemon.RESPONSE_PORT);
    }
    
}
