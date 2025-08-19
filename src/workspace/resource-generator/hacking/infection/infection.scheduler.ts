import * as Referentiel from 'workspace/referentiel'
import { getNextTarget, getUnlockTarget } from 'workspace/resource-generator/hacking/unlock/unlock.selector'
import {getAvailablePortProgram} from 'workspace/resource-generator/hacking/unlock/open-ports.worker'
import * as Log from 'workspace/frameworks/logging';
import { waitEndExecution } from 'workspace/frameworks/execution'
import {ServerData} from 'workspace/servers/domain/model/ServerData'
import {getPortPrograms} from 'workspace/resource-generator/hacking/model/PortProgram'
import { Headhunter } from 'workspace/common/headhunter';

//#region Constants
export const SCAN_SCRIPT = Referentiel.HACKING_DIRECTORY + '/scan/scan.scheduler.ts';
export const UNLOCK_SCRIPT = Referentiel.HACKING_DIRECTORY + '/unlock/unlock.launcher.ts';
export const PAYLOAD_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/payload.launcher.ts';
const getTargets = async (ns: NS) => getUnlockTarget(ns)
const work = async (ns: NS, targets: string[]) => {
    let nextTarget: ServerData | undefined;

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
            
            if (getAvailablePortProgram(ns).length < (nextTarget?.unlockRequirements.numOpenPortsRequired as number)) {
                const title = 'Port opener manquant pour continuer l\'infection'
                const moveMessage = '1. Go to City > [alpha ent.];'
                const buyMessage = '2. Purchase TOR router;'
                const commandMessage = 'cmd : buy ' + getPortPrograms(ns)
                        .map(x => x.filename)
                        .filter(x => getAvailablePortProgram(ns).some(y => y.filename === x))
                        .shift() + ';'
                let todoList: string[] = [commandMessage]
                if (!ns.hasTorRouter()) {
                    todoList = [moveMessage, buyMessage, '3. ' + commandMessage]
                }
                ns.alert(title + '\n\n' + todoList.join('\n'));
            }
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
    
    if (nextTarget === undefined) {
        return;
    }
        
    // ouverture accès root
    const pidUnlock = ns.run(UNLOCK_SCRIPT);
    
    if (pidUnlock !== 0) {
        ns.print(`Wait ${Log.action('unlock')} end...`);
        // attendre l'ouverture de l'accès root
        await waitEndExecution(ns, pidUnlock);
    }

    // Spreading + Payload
    ns.run(PAYLOAD_SCRIPT);
}
const isKillConditionReached = (ns: NS): boolean => {
    return getNextTarget(ns) === undefined 
        // pas de scan en cours
        && !ns.isRunning(SCAN_SCRIPT)
}
//#endregion Constantes

export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);

    setupDashboard(ns);

    // waitNewTargets = false : targets fix and discovered by scan
    const daemon = new Headhunter<string>(ns, () => getTargets(ns), work, false, undefined, () => isKillConditionReached(ns));
    
    if (!input.runHasLoop) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();

    ns.ui.closeTail();
}

function setupDashboard(ns: NS) {
    ns.disableLog('asleep');
    ns.disableLog('getHackingLevel');
    ns.clearLog();
    
    Log.initTailTitle(ns, 'Infection', 'Scheduler');
    ns.ui.openTail();
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
		runHasLoop: ns.args[0] !== undefined ? (ns.args[0] as boolean) : true
	};
}
//#endregion Input arguments
