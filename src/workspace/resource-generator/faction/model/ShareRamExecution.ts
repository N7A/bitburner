import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import * as Log from 'workspace/socle/utils/logging';
import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest';
import { ProcessRequestType } from 'workspace/load-balancer/domain/model/ProcessRequestType'
import * as Referentiel from 'workspace/common/referentiel'

//#region Constants
const SHARE_SCRIPT = Referentiel.FACTION_DIRECTORY + '/' + 'share-ram.daemon.ts';
//#endregion Constants

export class ShareRamExecution implements RamResourceExecution {
    request: ProcessRequest;

    constructor(request: ProcessRequest) {
        this.request = request;
    }

    getActionLog(): string {
        return Log.action('Sharing');
    }
    
    async isExecutionUsless(ns: NS): Promise<boolean> {
        // check if script useless
        if (ns.getPlayer().factions.length === 0) {
            ns.print("WARN", " ", "Aucune faction rejointe, partage de RAM inutile");
            return true;
        }

        return false;
    }

    setupDashboard(ns: NS, pid: number, targetHost: string) {
        ns.disableLog("ALL");
        ns.enableLog("share");
        
        Log.initTailTitle(ns, 'Share RAM', 'looper', targetHost, pid);
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