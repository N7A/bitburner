import * as Referentiel from 'workspace/common/referentiel'
import { getNextTarget, getUnlockTarget } from 'workspace/resource-generator/hacking/unlock/unlock.selector'
import {getAvailablePortProgram} from 'workspace/resource-generator/hacking/unlock/open-ports.worker'
import * as Log from 'workspace/socle/utils/logging';
import { waitEndAllExecutions } from 'workspace/socle/utils/execution'
import {ServerData} from 'workspace/servers/domain/model/ServerData'
import {getPortPrograms} from 'workspace/resource-generator/hacking/model/PortProgram'
import { Headhunter } from 'workspace/socle/interface/headhunter';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { DaemonFlags } from 'workspace/common/model/DaemonFlags';
import { Logger } from 'workspace/socle/Logger';

//#region Constants
const FLAGS_SCHEMA: [string, string | number | boolean | string[]][] = [
    [DaemonFlags.oneshot, false]
];
export const SCAN_SCRIPT = Referentiel.CMD_HACKING_DIRECTORY + '/scan/scan.scheduler.ts';
const UNLOCK_WORKER_SCRIPT = Referentiel.HACKING_DIRECTORY + '/unlock/unlock.worker.ts';
export const PAYLOAD_SCRIPT = Referentiel.CMD_HACKING_DIRECTORY + '/payload/payload.launcher.ts';
//#endregion Constantes

export async function main(ns: NS) {
    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);

    const daemon = new Main(ns);
    
    if (scriptFlags[DaemonFlags.oneshot]) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();

    ns.ui.closeTail();
}

class Main extends Headhunter<string> {
    private logger: Logger
    private dashboard: Dashboard;

    constructor(ns: NS) {
        // waitNewTargets = false : targets fix and auto discovered
        super(ns, false)
        this.logger = new Logger(ns);
        this.dashboard = new Dashboard(ns, 'Infection', {icon: '🦠', role: 'Scheduler'});
        this.setupDashboard();
    }

    async work(targets: string[]): Promise<any> {
        let nextTarget: ServerData | undefined;

        // wait until next target unlockable
        this.logger.waiting(`Wait until ${Log.action('unlock')} possible`);
        do {
            // maj next target
            const newNextTarget = getNextTarget(this.ns)
            // maj affichage si target a changé
            if (newNextTarget !== undefined && newNextTarget.name != nextTarget?.name) {
                this.refreshDashbord(newNextTarget);

                if (getAvailablePortProgram(this.ns).length < (nextTarget?.unlockRequirements.numOpenPortsRequired as number)) {
                    this.alertGetPortOpenerProcess()
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
        this.logger.stopWaiting();
        
        if (nextTarget === undefined) {
            return;
        }
            
        // ouverture accès root
        this.logger.waiting(`Wait ${Log.action('unlock')} end`);
        await this.unlockAllPossible();
        this.logger.stopWaiting();

        // Spreading + Payload
        this.ns.run(PAYLOAD_SCRIPT);
    }

    async getTargets(): Promise<string[]> {
        return getUnlockTarget(this.ns);
    }

    /**
     * Donne l'accès root aux cibles données par le scan, 
     * si le niveau de hacking et les ports opener sont suffisant.
     */
    async unlockAllPossible() {
        // load target files
        const targets: string[] = getUnlockTarget(this.ns);
        
        let unlockLaunched: number[] = [];

        //#region accès root
        for (const targetHostname of targets) {
            // TODO : wait until ram dispo
            var pidUnlock: number = this.ns.run(UNLOCK_WORKER_SCRIPT, {preventDuplicates: true}, targetHostname);

            if (pidUnlock === 0) {
                this.logger.err(targetHostname, ' : ', 'Nuke KO')
                return;
            }

            this.logger.trace(`START ${Log.action('Unlock')} ${Log.target(targetHostname)}`);
            
            unlockLaunched.push(pidUnlock);
        }
        //#endregion
        
        await waitEndAllExecutions(this.ns, unlockLaunched);
    }

    alertGetPortOpenerProcess() {
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

    refreshDashbord(newNextTarget: ServerData) {
        this.logger.log(Log.INFO('Next target', newNextTarget.name));
        this.logger.log(Log.INFO('Next target ports needed', newNextTarget.unlockRequirements.numOpenPortsRequired));
        this.logger.log(Log.INFO('Next target lvl needed', newNextTarget.unlockRequirements.requiredHackingSkill));
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
        
        this.dashboard.initTailTitle();
        this.ns.ui.openTail();
    }
    //#endregion Dashboard
}