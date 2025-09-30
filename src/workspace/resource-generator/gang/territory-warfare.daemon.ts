import { Daemon } from 'workspace/socle/interface/daemon';
import * as Log from 'workspace/socle/utils/logging';
import { GANG_LOGO } from 'workspace/resource-generator/gang/application-properties';
import { Dashboard } from 'workspace/socle/interface/dashboard';

let daemon: TerritoryWarfareDaemon;

/**
 * Share RAM to faction.
 */
export async function main(ns: NS) {
    // load input arguments
    const input: InputArg = getInput(ns);
 
    daemon = new TerritoryWarfareDaemon(ns);
    
    daemon.setupDashboard();

    if (!input.runHasLoop) {
        daemon.killAfterLoop();
    }

    await daemon.run();
}

//#region Input arguments
type InputArg = {
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

// TODO: will not work, find the good way
export function killAfterLoop() {
    daemon.killAfterLoop();
}

class TerritoryWarfareDaemon extends Daemon {
    private dashboard: Dashboard;
    
    constructor(ns: NS) {
        super(ns);
        
        this.dashboard = new Dashboard(ns, 'Territory warfare', {icon: '⚔️', role: 'Daemon'});
    }
    
    async work() {
        if (this.ns.gang.getGangInformation().territoryWarfareEngaged) {
            // wait war to be possible
            await this.waitPeaceTime();
            // disable war
            this.ns.gang.setTerritoryWarfare(true);
            this.ns.print(`${GANG_LOGO} Peace time 🕊️`); //🛑⚔️
        } else {
            // wait war to be possible
            await this.waitWarTime();
            // démobilisation
            this.ns.gang.getMemberNames().forEach(x => this.ns.gang.setMemberTask(x, 'Unassigned'))
            // enable war
            this.ns.gang.setTerritoryWarfare(true);
            this.ns.print(`${GANG_LOGO} Le gang entre dans l'arène ⚔️⚔️ !`);
        }
    }

    async waitWarTime() {
        // wait war to be possible
        while(!this.isPossible() || !this.isUseful() || this.isPainful()) {
            // sleep to prevent crash because of infinite loop
            await this.ns.sleep(500);
            if (this.ns.gang.getGangInformation().territoryWarfareEngaged) {
                return;
            }
        }
    }

    async waitPeaceTime() {
        // wait war to be impossible
        while(this.isPossible() && this.isUseful() && !this.isPainful()) {
            // sleep to prevent crash because of infinite loop
            await this.ns.sleep(500);
            if (!this.ns.gang.getGangInformation().territoryWarfareEngaged) {
                return;
            }
        }
    }

    isPossible() {
        return true;
    }

    isUseful() {
        // TODO: influance sur le business
        return this.ns.gang.getGangInformation().territory < 1;
    }

    isPainful() {
        return Object.keys(this.ns.gang.getOtherGangInformation())
            .some(gangName => this.ns.gang.getChanceToWinClash(gangName) < 0.5);
    }

    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
        
        this.dashboard.initTailTitle();
    }
}