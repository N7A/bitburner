import { Daemon } from 'workspace/socle/interface/daemon';
import * as Log from 'workspace/socle/utils/logging';
import { Logger } from 'workspace/socle/Logger';
import { getAvailableEquipements, getBestEquipement } from 'workspace/resource-generator/gang/equipement.selector';
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { DaemonFlags } from 'workspace/common/model/DaemonFlags';

//#region Constantes
const FLAGS_SCHEMA: [string, string | number | boolean | string[]][] = [
    [DaemonFlags.oneshot, false]
];
//#endregion Constantes

let daemon: EquipMemberDaemon;

/**
 * Share RAM to faction.
 */
export async function main(ns: NS) {
    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);
    // load input arguments
    const input: InputArg = getInput(ns);
 
    daemon = new EquipMemberDaemon(ns, input.memberName);
    
    daemon.setupDashboard();

    if (scriptFlags[DaemonFlags.oneshot]) {
        daemon.killAfterLoop();
    }

    await daemon.run();
}

//#region Input arguments
type InputArg = {
    memberName: string;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
    const logger = new Logger(ns);
    if (ns.args[0] === undefined) {
        logger.err('Merci de renseigner un hostname');
        ns.exit();
    }

    logger.trace(Log.title('Arguments'));
    logger.trace(ns.args?.toString());

    const input = {
        memberName: (ns.args[0] as string)
    };
    
    logger.trace(Log.title('Données d\'entrée'));
    logger.trace(Log.object(input));
    return input;
}
//#endregion Input arguments

// TODO: will not work, find the good way
export function killAfterLoop() {
    daemon.killAfterLoop();
}

class EquipMemberDaemon extends Daemon {
    private dashboard: Dashboard;
    private memberName: string;
    private moneyPiggyBankService: MoneyPiggyBankService;

    constructor(ns: NS, memberName: string) {
        super(ns);
        this.memberName = memberName;
        this.moneyPiggyBankService = new MoneyPiggyBankService(ns);
        this.dashboard = new Dashboard(ns, `${Log.source(this.memberName, {colorless: true})} Equip member`, {icon: '🎒', role: 'Daemon'});
    }
    
    async work() {
        let nextUpgrade = this.getNextUpgrade();
        // wait purchase to be possible
        while(nextUpgrade !== null && this.moneyPiggyBankService.getDisponibleMoney(this.ns.getPlayer().money) < this.ns.gang.getEquipmentCost(nextUpgrade)) {
            // sleep to prevent crash because of infinite loop
            await this.ns.sleep(500);

            // refresh nextUpgrade
            nextUpgrade = this.getNextUpgrade();
        }

        if (nextUpgrade === null) {
            return;
        }

        // achat de l'equipement
        this.ns.gang.purchaseEquipment(this.memberName, nextUpgrade);
        this.ns.print(`✨🆙🔨 Equipement ${nextUpgrade} ! ✨`);
    }

    getNextUpgrade() {
        const currentTask = this.ns.gang.getTaskStats(this.ns.gang.getMemberInformation(this.memberName).task);
        const equipementToUp = getAvailableEquipements(this.ns)
            // filtrage des équipements déjà achetés
            .filter(x => !this.ns.gang.getMemberInformation(this.memberName).upgrades.includes(x) 
            && !this.ns.gang.getMemberInformation(this.memberName).augmentations.includes(x));
        
        if (equipementToUp.length <= 0) {
            this.killAfterLoop();
            return null;
        }

        // TODO : prioriser upgrade; 
        // prendre en compte le prix quantité d'argent actuelle et la production /s actuelle (temps nécessaire moyen pour pouvoir acheter)
        const bestEquipement = getBestEquipement(this.ns, equipementToUp, currentTask.name);
        return bestEquipement.pop();
    }

    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
        
        this.dashboard.initTailTitle();
    }
}