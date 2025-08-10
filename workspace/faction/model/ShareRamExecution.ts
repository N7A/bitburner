import * as Referentiel from 'workspace/referentiel'
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import * as Log from 'workspace/frameworks/logging';

export class ShareRamExecution implements RamResourceExecution {
    private scripts: string[];

    constructor() {
        this.scripts = [Referentiel.FACTION_DIRECTORY + '/' + 'share-ram.worker.ts']
    }
    getScript() {
        return this.scripts;
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
        ns.clearLog();
        
        Log.initTailTitle(ns, 'Share RAM', 'looper', targetHost, pid);
        
        ns.print('Waiting to share...');
    }
}