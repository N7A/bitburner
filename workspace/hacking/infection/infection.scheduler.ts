import * as Referentiel from 'workspace/referentiel'
import {Targets} from 'workspace/hacking/model/Targets'
import {getAvailablePortProgram, getNextTarget} from 'workspace/hacking/unlock/utils'
import * as Log from 'workspace/logging-framework/main'
import * as TargetsRepository from 'workspace/domain/targets/targets.repository'
import { waitEndExecution } from 'workspace/frameworks/execution'
import { TargetHost } from 'workspace/hacking/model/TargetHost'

export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);

    setupDashboard(ns);

    let nextTarget: TargetHost | undefined;
    do {
        ns.print(Log.getStartLog());
            
        // wait until next target unlockable
        ns.print(`Wait until ${Log.action('unlock')} possible...`);
        do {
            // maj next target
            const newNextTarget = getNextTarget(ns)
            if (newNextTarget !== undefined && newNextTarget != nextTarget) {
                ns.print(Log.INFO('Next target', newNextTarget.name));
                ns.print(Log.INFO('Next target ports needed', newNextTarget.unlockRequirements.numOpenPortsRequired));
                ns.print(Log.INFO('Next target lvl needed', newNextTarget.unlockRequirements.requiredHackingSkill));
            }
            nextTarget = newNextTarget;
            await ns.asleep(500);
        } while (
            nextTarget !== undefined 
            && (
                ns.getHackingLevel() < (nextTarget.unlockRequirements.requiredHackingSkill  as number)
                || getAvailablePortProgram(ns).length < (nextTarget.unlockRequirements.numOpenPortsRequired as number)
            )
        )
        
        if (nextTarget !== undefined) {
            // ouverture accès root
            const pidUnlock = ns.run(Referentiel.HACKING_DIRECTORY + '/unlock/unlock.launcher.ts');
            
            if (pidUnlock !== 0) {
                ns.print(`Wait ${Log.action('unlock')} end...`);
                // attendre l'ouverture de l'accès root
                await waitEndExecution(ns, pidUnlock);
            }
        }

        // TODO : need scan target up to date here

        // load targets
        const targets: Targets = TargetsRepository.get(ns);

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
        if (true && input.runHasLoop) {
            await ns.asleep(500);
        }
    } while(true && input.runHasLoop && nextTarget !== undefined)
    ns.ui.closeTail();
}

function setupDashboard(ns: NS) {
    ns.disableLog('asleep');
    ns.disableLog('getHackingLevel');
    ns.clearLog();
    
    ns.ui.openTail();
    ns.ui.setTailTitle('Infection #Scheduler');
}

//#region Input arguments
type InputArg = {
	/** Serveur cible */
	runHasLoop: boolean;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
	return {
		runHasLoop: ns.args[0] ? (ns.args[0] as boolean) : true
	};
}
//#endregion Input arguments
