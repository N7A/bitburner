import * as Referentiel from 'workspace/common/referentiel'
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest';
import * as Log from 'workspace/socle/utils/logging';
import { ProcessRequestType } from 'workspace/load-balancer/domain/model/ProcessRequestType';
import { Dashboard } from 'workspace/socle/interface/dashboard';

//#region Constants
export const SETUP_SCRIPT = Referentiel.CMD_HACKING_DIRECTORY + '/payload/setup-server.sequencer.ts';
//#endregion Constants

export class SetupHackExecution implements RamResourceExecution {
    private ns: NS;
    private dashboard: Dashboard;
    private targetHostname: string;
    request: ProcessRequest;

    constructor(ns: NS, request: ProcessRequest) {
        this.ns = ns;
        this.targetHostname = request.id;
        this.request = request;

        this.dashboard = new Dashboard(ns, `Setup ${Log.target(this.targetHostname, {colorless: true})}`, {icon: '🛠️🖥️', role: 'looper'});
    }

    async isExecutionUsless(): Promise<boolean> {
        /*const serversRepository = new ServersRepository(this.ns);
        // load host data
        const data: ServerData|null = serversRepository.get(this.targetHostname);
        const hackData: HackData = data!.hackData;
        return this.ns.getServer(this.targetHostname).hackDifficulty <= hackData.minDifficulty
            && this.ns.getServer(this.targetHostname).moneyAvailable >= hackData.moneyMax*/
        return false;
    }
    
    getActionLog(): string {
        return `${Log.action('Setup')} ${this.targetHostname}`;
    }
    
    setupDashboard() {
        this.dashboard.initTailTitle();
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