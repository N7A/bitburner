import { Daemon } from 'workspace/socle/interface/daemon';
import { GANG_LOGO } from 'workspace/resource-generator/gang/application-properties';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { DaemonFlags } from 'workspace/common/model/DaemonFlags';

//#region Constantes
const FLAGS_SCHEMA: [string, string | number | boolean | string[]][] = [
    [DaemonFlags.oneshot, false]
];
//#endregion Constantes

let daemon: TerritoryWarfareDaemon;

/**
 * Share RAM to faction.
 */
export async function main(ns: NS) {
    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);
 
    daemon = new TerritoryWarfareDaemon(ns);
    
    daemon.setupDashboard();

    if (scriptFlags[DaemonFlags.oneshot]) {
        daemon.killAfterLoop();
    }

    await daemon.run();
}

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