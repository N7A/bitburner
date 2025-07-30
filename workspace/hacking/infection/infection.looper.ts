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

    ns.disableLog('asleep');
    ns.disableLog('getHackingLevel');
    
    let nextTarget;
    do {
        ns.print(Log.getStartLog());
        nextTarget = getNextTarget(ns);
        if (nextTarget !== undefined) {
            ns.print(Log.INFO('Next target', getNextTarget(ns)?.name));
            ns.print(Log.INFO('Next target ports needed', getNextTarget(ns)?.unlockRequirements.numOpenPortsRequired));
            ns.print(Log.INFO('Next target lvl needed', getNextTarget(ns)?.unlockRequirements.requiredHackingSkill));
            
            ns.print('Wait unlock possible...');
            // wait until next target unlockable
            while (
                ns.getHackingLevel() < (nextTarget.unlockRequirements.requiredHackingSkill  as number)
                || getAvailablePortProgram(ns).length < (nextTarget.unlockRequirements.numOpenPortsRequired as number)
            ) {
                await ns.asleep(500);
                nextTarget = getNextTarget(ns);
            }
        
            // ouverture accès root
            const pidUnlock = ns.run(Referentiel.HACKING_DIRECTORY + '/unlock/unlock.launcher.ts');
            
            ns.print('Wait unlock end...');
            // attendre l'ouverture de l'accès root
            while (pidUnlock != 0 && ns.isRunning(pidUnlock)) {
                await ns.asleep(500);
            }
        }

        // TODO : need scan target up to date here

        // load targets
        let targets: Targets = TargetsRepository.get(ns);

        // Spreading + Payload
        if (targets.hackTargets.length > 0) {
            ns.run(Referentiel.HACKING_DIRECTORY + '/payload/payload.launcher.ts');
        }

        // recherche des cibles
        if (targets.scanTargets.length > 0) {
            const pidScan = ns.run(Referentiel.HACKING_DIRECTORY + '/scan/scan.launcher.ts');
            
            ns.print('Wait scan end...');
            // attendre la découverte de nouvelle cibles à unlock
            while (pidScan != 0 && ns.isRunning(pidScan)) {
                await ns.asleep(500);
            }
        }
        
        // TODO : need unlock target up to date here
        ns.print(Log.getEndLog());

        // TODO : check repository maj instead || next target time
        if (true && !runOnce) {
            await ns.asleep(500);
        }
    } while(true && !runOnce && nextTarget !== undefined)
}