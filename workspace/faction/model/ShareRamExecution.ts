import * as Referentiel from 'workspace/referentiel'
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';

export class ShareRamExecution implements RamResourceExecution {
    readonly SCRIPTS: string[] = [Referentiel.FACTION_DIRECTORY + '/' + 'share-ram.worker.ts'];

    isExecutionUsless(ns: NS): boolean {
        // check if script useless
        if (ns.getPlayer().factions.length === 0) {
            ns.print("WARN", " ", "Aucune faction rejointe, partage de RAM inutile");
            return true;
        }

        return false;
    }
}