import * as Referentiel from 'workspace/referentiel'
import { getNextTarget, getUnlockTarget } from 'workspace/resource-generator/hacking/unlock/unlock.selector'
import {getAvailablePortProgram} from 'workspace/resource-generator/hacking/unlock/open-ports.worker'
import * as Log from 'workspace/socle/logging';
import { waitEndExecution } from 'workspace/socle/execution'
import {ServerData} from 'workspace/servers/domain/model/ServerData'
import {getPortPrograms} from 'workspace/resource-generator/hacking/model/PortProgram'
import { Headhunter } from 'workspace/common/headhunter';

//#region Constants
export const SCAN_SCRIPT = Referentiel.CMD_HACKING_DIRECTORY + '/scan/scan.scheduler.ts';
export const UNLOCK_SCRIPT = Referentiel.HACKING_DIRECTORY + '/unlock/unlock.launcher.ts';
export const PAYLOAD_SCRIPT = Referentiel.CMD_HACKING_DIRECTORY + '/payload/payload.launcher.ts';
//#endregion Constantes

export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);

    const daemon = new Main(ns);
    
    if (!input.runHasLoop) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();

    ns.ui.closeTail();
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

class Main extends Headhunter<string> {
    constructor(ns: NS) {
        // waitNewTargets = false : targets fix and auto discovered
        super(ns, false)
        this.setupDashboard();
    }

    async work(targets: string[]): Promise<any> {
        let nextTarget: ServerData | undefined;

        // wait until next target unlockable
        this.ns.print(`Wait until ${Log.action('unlock')} possible...`);
        do {
            // maj next target
            const newNextTarget = getNextTarget(this.ns)
            // maj affichage si target a changé
            if (newNextTarget !== undefined && newNextTarget.name != nextTarget?.name) {
                this.ns.print(Log.INFO('Next target', newNextTarget.name));
                this.ns.print(Log.INFO('Next target ports needed', newNextTarget.unlockRequirements.numOpenPortsRequired));
                this.ns.print(Log.INFO('Next target lvl needed', newNextTarget.unlockRequirements.requiredHackingSkill));
                
                if (getAvailablePortProgram(this.ns).length < (nextTarget?.unlockRequirements.numOpenPortsRequired as number)) {
                    const title = 'Port opener manquant pour continuer l\'infection'
                    const moveMessage = '1. Go to City > [alpha ent.];'
                    const buyMessage = '2. Purchase TOR router;'
                    const commandMessage = 'cmd : buy ' + getPortPrograms(this.ns)
                            .map(x => x.filename)
                            .filter(x => getAvailablePortProgram(this.ns).some(y => y.filename === x))
                            .shift() + ';'
                    let todoList: string[] = [commandMessage]
                    if (!this.ns.hasTorRouter()) {
                        todoList = [moveMessage, buyMessage, '3. ' + commandMessage]
                    }
                    this.ns.alert(title + '\n\n' + todoList.join('\n'));
                }
            }
            nextTarget = newNextTarget;
            await this.ns.asleep(500);
        } while (
            nextTarget !== undefined 
            && (
                this.ns.getHackingLevel() < (nextTarget.unlockRequirements.requiredHackingSkill  as number)
                || getAvailablePortProgram(this.ns).length < (nextTarget.unlockRequirements.numOpenPortsRequired as number)
            )
        )
        
        if (nextTarget === undefined) {
            return;
        }
            
        // ouverture accès root
        const pidUnlock = this.ns.run(UNLOCK_SCRIPT);
        
        if (pidUnlock !== 0) {
            this.ns.print(`Wait ${Log.action('unlock')} end...`);
            // attendre l'ouverture de l'accès root
            await waitEndExecution(this.ns, pidUnlock);
        }

        // Spreading + Payload
        this.ns.run(PAYLOAD_SCRIPT);
    }

    async getTargets(): Promise<string[]> {
        return getUnlockTarget(this.ns);
    }

    isKillConditionReached(): boolean {
        return getNextTarget(this.ns) === undefined 
            // pas de scan en cours
            && !this.ns.isRunning(SCAN_SCRIPT)
    }

    //#region Dashboard
    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
        
        Log.initTailTitle(this.ns, 'Infection', 'Scheduler');
        this.ns.ui.openTail();
    }
    //#endregion Dashboard
}