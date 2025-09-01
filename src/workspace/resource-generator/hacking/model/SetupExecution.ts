import * as Referentiel from 'workspace/referentiel'
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest';
import * as Log from 'workspace/socle/utils/logging';
import { ProcessRequestType } from 'workspace/load-balancer/domain/model/ProcessRequestType';

//#region Constants
export const SETUP_SCRIPT = Referentiel.CMD_HACKING_DIRECTORY + '/payload/setup-server.sequencer.ts';
//#endregion Constants

export class SetupHackExecution implements RamResourceExecution {
    private targetHostname: string;
    request: ProcessRequest;

    constructor(request: ProcessRequest) {
        this.targetHostname = request.id;
        this.request = request;
    }

    isExecutionUsless(ns: NS): boolean {
        /*const serversRepository = new ServersRepository(ns);
        // load host data
        const data: ServerData|null = serversRepository.get(this.targetHostname);
        const hackData: HackData = data!.hackData;
        return ns.getServer(this.targetHostname).hackDifficulty <= hackData.minDifficulty
            && ns.getServer(this.targetHostname).moneyAvailable >= hackData.moneyMax*/
        return false;
    }
    
    getActionLog(): string {
        return `${Log.action('Setup')} ${this.targetHostname}`;
    }
    
    setupDashboard(ns: NS, pid: number, targetHost: string) {        
        Log.initTailTitle(ns, 'Setup', 'looper', targetHost, pid);
    }

    static getRequest(targetHostname: string): ProcessRequest {
        return {
            type: ProcessRequestType.SETUP_HACK, 
            id: targetHostname, 
            weight: 1,
            request: {
                wantedThreadNumber: 1,
                scripts: [{scriptsFilepath: SETUP_SCRIPT, args: [targetHostname]}]
            },
            label: `${Log.action('Setup')} ${targetHostname}`
        };
    }
}