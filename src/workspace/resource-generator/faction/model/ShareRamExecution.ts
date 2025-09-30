import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import * as Log from 'workspace/socle/utils/logging';
import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest';
import { ProcessRequestType } from 'workspace/load-balancer/domain/model/ProcessRequestType'
import * as Referentiel from 'workspace/common/referentiel'
import { Dashboard } from 'workspace/socle/interface/dashboard';

//#region Constants
const SHARE_SCRIPT = Referentiel.FACTION_DIRECTORY + '/' + 'share-ram.daemon.ts';
//#endregion Constants

export class ShareRamExecution implements RamResourceExecution {
    private ns: NS;
    private dashboard: Dashboard;
    request: ProcessRequest;

    constructor(ns: NS, request: ProcessRequest) {
        this.ns = ns;
        this.request = request;

        this.dashboard = new Dashboard(ns, 'Share RAM', {icon: '♻️⚡️', role: 'looper'});
    }

    getActionLog(): string {
        return Log.action('Sharing');
    }
    
    async isExecutionUsless(): Promise<boolean> {
        // check if script useless
        if (this.ns.getPlayer().factions.length === 0) {
            this.ns.print("WARN", " ", "Aucune faction rejointe, partage de RAM inutile");
            return true;
        }

        return false;
    }

    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.enableLog("share");
        
        this.dashboard.initTailTitle();
    }

    static getRequest(): ProcessRequest {
        return {
                type: ProcessRequestType.SHARE_RAM,
                request: {
                    scripts: [{scriptsFilepath: SHARE_SCRIPT}]
                }
            }
    }
}