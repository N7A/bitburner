import * as Referentiel from 'workspace/referentiel'
import {Targets} from 'workspace/hacking/model/Targets'
import {getAvailablePortProgram, getNextTarget} from 'workspace/hacking/unlock/utils'
import * as Log from 'workspace/frameworks/logging'
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
            // maj affichage si target a changé
            if (newNextTarget !== undefined && newNextTarget.name != nextTarget?.name) {
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

        // load targets
        const targets: Targets = TargetsRepository.get(ns);

        // Spreading + Payload
        if (targets.hackTargets.length > 0) {
            ns.run(Referentiel.HACKING_DIRECTORY + '/payload/payload.launcher.ts');
        }

        ns.print(Log.getEndLog());

        // TODO : check repository maj instead || next target time
        if (needLoop(ns, input, nextTarget)) {
            await ns.asleep(500);
        }
    } while(needLoop(ns, input, nextTarget))
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

function needLoop(ns: NS, input: InputArg, nextTarget: TargetHost | undefined): boolean {
    // scprit lancé en mode loop
    return input.runHasLoop 
    && (
        // il reste des cibles
        nextTarget !== undefined 
        // scan en cours
        || ns.isRunning(Referentiel.HACKING_DIRECTORY + '/scan/scan.scheduler.ts')
    )
}