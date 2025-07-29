import * as Referentiel from 'workspace/referentiel'
import {Targets} from 'workspace/hacking/model/Targets'
import {getAvailablePortProgram, getNextTarget} from 'workspace/hacking/unlock/utils'
import * as Log from 'workspace/logging-framework/main'
import * as TargetsRepository from 'workspace/domain/targets/targets.repository'

export async function main(ns: NS) {
    //#region input parameters
    var sourceHost: string = ns.args.length >= 1 ? ns.args[0] as string : ns.getHostname();
    var runOnce: boolean = ns.args.length >= 1 ? ns.args[0] as boolean : false;
    //#endregion input parameters

    do {
        ns.print(Log.getStartLog());
        let nextTarget = getNextTarget(ns);
        if (nextTarget !== undefined) {
            let currentHackLvl = ns.getHackingLevel();
            let currentAvailablePortProgram = getAvailablePortProgram(ns);

            ns.print(Log.INFO('Next target', getNextTarget(ns)?.name));
            ns.print(Log.INFO('Next target ports needed', getNextTarget(ns)?.unlockRequirements.numOpenPortsRequired));
            ns.print(Log.INFO('Next target lvl needed', getNextTarget(ns)?.unlockRequirements.requiredHackingSkill));
            
            // check next target unlockable
            if (
                currentHackLvl >= (nextTarget.unlockRequirements.requiredHackingSkill  as number)
                && currentAvailablePortProgram.length >=(nextTarget.unlockRequirements.numOpenPortsRequired as number)
            ) {
                // ouverture accès root
                const pidUnlock = ns.run(Referentiel.HACKING_DIRECTORY + '/unlock/unlock.launcher.ts');
                
                // attendre l'ouverture de l'accès root
                while (pidUnlock != 0 && ns.isRunning(pidUnlock)) {
                    await ns.asleep(500);
                }

                // load targets
                let targets: Targets = TargetsRepository.get(ns);

                // recherche des cibles
                if (targets.scanTargets.length > 0) {
                    ns.run(Referentiel.HACKING_DIRECTORY + '/scan/scan.launcher.ts');
                }
                
                // Spreading + Payload
                if (targets.hackTargets.length > 0) {
                    ns.run(Referentiel.HACKING_DIRECTORY + '/payload/payload.launcher.ts');
                }
            }
        }
        ns.print(Log.getEndLog());

        // TODO : check repository maj instead || next target time
        if (true && !runOnce) {
            await ns.asleep(500);
        }
    } while(true && !runOnce)
}