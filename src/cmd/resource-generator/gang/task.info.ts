import * as Log from 'workspace/socle/utils/logging';
import { Logger } from 'workspace/socle/Logger';
import { Info } from 'workspace/socle/interface/info';

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
    const logger = new Logger(ns);
    if (ns.args[0] === undefined) {
        logger.err('Merci de renseigner un hostname');
        ns.exit();
    }

    logger.trace(Log.title('Arguments'));
    logger.trace(ns.args?.toString());

    const input = {
        taskNameTarget: (ns.args[0] as string)
    };
    
    logger.trace(Log.title('Données d\'entrée'));
    logger.trace(Log.object(input));
    return input;
}
//#endregion Input parameters

class TaskInfo extends Info {
    private data: GangTaskStats;

    constructor(ns: NS, data: GangTaskStats) {
        super(ns, data.name);
        this.data = data;
    }

    printData() {
        this.ns.print(Log.INFO('Combat task', this.data.isCombat));
        this.ns.print(Log.INFO('Hacking task', this.data.isHacking));
        this.ns.print('\n');
        this.ns.print(Log.title('Weight'));
        const weightStats = [
            'hackWeight',
            'strWeight',
            'defWeight',
            'dexWeight',
            'agiWeight',
            'chaWeight'
        ]
        for (const weightStat of weightStats) {
            if (this.data[weightStat as keyof GangTaskStats] as number > 0) {
                this.ns.print(Log.INFO(weightStat, this.data[weightStat as keyof GangTaskStats] as number));
            }
        }
        this.ns.print(Log.INFO('Territory', JSON.stringify(this.data.territory)));
        this.ns.print(Log.INFO('Difficulty', this.data.difficulty));
        this.ns.print('\n');
        this.ns.print(Log.title('Gain'));
        this.ns.print(Log.INFO('Money', this.data.baseMoney));
        this.ns.print(Log.INFO('Respect', this.data.baseRespect));
        this.ns.print(Log.INFO('Wanted', this.data.baseWanted));
    }
}
