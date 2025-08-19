import * as Referentiel from 'workspace/referentiel'
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import * as Log from 'workspace/frameworks/logging';
import { ExecutionRequest } from 'workspace/load-balancer/model/ExecutionServer';
import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest';

export class ShareRamExecution implements RamResourceExecution {
    private executionRequest: ExecutionRequest;
    request: ProcessRequest;

    constructor(request: ProcessRequest) {
        this.request = request;
        this.executionRequest = {
            scripts: [{scriptsFilepath: Referentiel.FACTION_DIRECTORY + '/' + 'share-ram.daemon.ts'}]
        }
    }

    getActionLog(): string {
        return Log.action('Sharing');
    }
    
    getExecutionRequest(): ExecutionRequest {
        return this.executionRequest;
    }

    isExecutionUsless(ns: NS): boolean {
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
}