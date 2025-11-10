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
    private static readonly NO_DATA = 'NULL PORT DATA';
    static readonly REQUEST_PORT = 1;
    static readonly RESPONSE_PORT = 2;
    //#endregion Constants

    private executionsRepository: ExecutionsRepository;

    constructor(ns: NS) {
        super(ns);
        
        this.executionsRepository = new ExecutionsRepository(ns);
    }
    
    async work(): Promise<any> {
        // quand plus de requete en attente on maj le port du getAll
        if (this.ns.peek(SgbdDaemon.REQUEST_PORT) === SgbdDaemon.NO_DATA) {
            this.ns.clearPort(SgbdDaemon.RESPONSE_PORT);
            await this.pushResponse(this.executionsRepository.getAll());
        }
        await Broker.waitNewData(this.ns, SgbdDaemon.REQUEST_PORT);
        // dès qu'on doit traiter une requete on invalide le port du getAll
        this.ns.clearPort(SgbdDaemon.RESPONSE_PORT);

        const commitRequest: CommitRequest = this.ns.readPort(SgbdDaemon.REQUEST_PORT);

        if (commitRequest.repository == Repository.EXECUTIONS) {
            this.handleExecutionRequest(commitRequest.data, commitRequest.type);
        }
    }

    handleExecutionRequest(data: any, type: CommitType) {
        if (type === CommitType.ADD) {
            this.executionsRepository.add(data);
        } else if (type === CommitType.SAVE) {
            this.executionsRepository.save(data);
        } else if (type === CommitType.REMOVE) {
            this.executionsRepository.remove(data);
        } else if (type === CommitType.RESET) {
            this.executionsRepository.reset(data);
        }
    }

    private async pushResponse(response: any) {
        await Broker.pushData(this.ns, SgbdDaemon.RESPONSE_PORT, response);
    }
    
    static async pushData(ns: NS, commitRequest: CommitRequest) {
        await Broker.pushData(ns, SgbdDaemon.REQUEST_PORT, commitRequest, COMMIT_HANDLER_SCRIPT);
    }
    
    static async getResponse(ns: NS): Promise<any> {
        return await Broker.peekResponse(ns, SgbdDaemon.RESPONSE_PORT);
    }
    
}
