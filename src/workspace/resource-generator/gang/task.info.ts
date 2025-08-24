import * as Log from 'workspace/frameworks/logging';
import { TerminalLogger } from 'workspace/common/TerminalLogger';
import { Info } from 'workspace/common/info';

export async function main(ns: NS) {
    const input: InputArg = getInput(ns);
    
    const taskData: GangTaskStats = ns.gang.getTaskStats(input.taskNameTarget);

    const info: TaskInfo = new TaskInfo(ns, taskData);
    
    info.run();
}

//#region Input parameters
type InputArg = {
    /** Serveur cible */
    taskNameTarget: string;
}

/**
 * Load input parameters
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
    const logger = new TerminalLogger(ns);
    if (ns.args[0] === undefined) {
        logger.err('Merci de renseigner un hostname');
        ns.exit();
    }

    return {
        taskNameTarget: (ns.args[0] as string)
    };
}
//#endregion Input parameters

//#region Dashboard
function setupDashboard(ns: NS, input: InputArg) {
    ns.disableLog("ALL");
    ns.clearLog();
    
    Log.initTailTitle(ns, Log.targetColorLess(input.taskNameTarget), 'info');
    
    ns.ui.openTail();
}
//#endregion Dashboard

class TaskInfo extends Info<GangTaskStats> {
    constructor(ns: NS, data: GangTaskStats) {
        super(ns, data.name, data)
    }

    printData() {
        this.ns.print(Log.INFO('Description', this.data.desc));
        this.ns.print(Log.INFO('Combat task', this.data.isCombat));
        this.ns.print(Log.INFO('Hacking task', this.data.isHacking));
        this.ns.print('\n');
        this.ns.print(Log.title('Weight'));
        this.ns.print(Log.INFO('Hack', this.data.hackWeight));
        this.ns.print(Log.INFO('Strength', this.data.strWeight));
        this.ns.print(Log.INFO('Defense', this.data.defWeight));
        this.ns.print(Log.INFO('Dexterity', this.data.dexWeight));
        this.ns.print(Log.INFO('Agility', this.data.agiWeight));
        this.ns.print(Log.INFO('Charisma', this.data.chaWeight));
        this.ns.print(Log.INFO('Territory', this.data.territory));
        this.ns.print(Log.INFO('Difficulty', this.data.difficulty));
        this.ns.print('\n');
        this.ns.print(Log.title('Gain'));
        this.ns.print(Log.INFO('Money', this.data.baseMoney));
        this.ns.print(Log.INFO('Respect', this.data.baseRespect));
        this.ns.print(Log.INFO('Wanted', this.data.baseWanted));
    }
}

function printData(ns: NS, data: GangTaskStats) {
    ns.print(Log.INFO('Description', data.desc));
    ns.print(Log.INFO('Combat task', data.isCombat));
    ns.print(Log.INFO('Hacking task', data.isHacking));
    ns.print('\n');
    ns.print(Log.title('Weight'));
    ns.print(Log.INFO('Hack', data.hackWeight));
    ns.print(Log.INFO('Strength', data.strWeight));
    ns.print(Log.INFO('Defense', data.defWeight));
    ns.print(Log.INFO('Dexterity', data.dexWeight));
    ns.print(Log.INFO('Agility', data.agiWeight));
    ns.print(Log.INFO('Charisma', data.chaWeight));
    ns.print(Log.INFO('Territory', data.territory));
    ns.print(Log.INFO('Difficulty', data.difficulty));
    ns.print('\n');
    ns.print(Log.title('Gain'));
    ns.print(Log.INFO('Money', data.baseMoney));
    ns.print(Log.INFO('Respect', data.baseRespect));
    ns.print(Log.INFO('Wanted', data.baseWanted));
}
