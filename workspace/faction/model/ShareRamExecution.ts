import * as Referentiel from 'workspace/referentiel'
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';

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
}