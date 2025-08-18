import * as Log from 'workspace/frameworks/logging';

/**
 * Execute en boucle une séquence ayant pour ressource une cible.
 */
export class Headhunter<T> {
    private ns: NS;
    private getTargets: () => Promise<T[]>;
    private work: (ns: NS, targets: T[]) => Promise<any>;
    private waitNewTargets: boolean;
    private runHasLoop: boolean;
    private durationLimit?: number;
    private isKillConditionReached: () => boolean

    /**
     * 
     * @param ns Bitburner API
     * @param work execution to loop
     * @param durationLimit maximum duration wanted (in ms)
     */
    constructor(
        ns: NS, 
        getTargets: () => Promise<T[]>, 
        work: (ns: NS, targets: T[]) => Promise<any>, 
        waitNewTargets: boolean, 
        durationLimit?: number,
        isKillConditionReached?: () => boolean
    ) {
        this.ns = ns;
        this.getTargets = getTargets;
        this.work = work;
        this.waitNewTargets = waitNewTargets;
        this.durationLimit = durationLimit;
        this.isKillConditionReached = isKillConditionReached;
    }
    
    async run() {
        const threadStartTime: Date = new Date();

        let targets = await this.getTargets();

        do {
            this.ns.print(Log.getStartLog());

            const workStartTime = new Date();

            this.ns.print(Log.INFO('Selected targets', targets));

            await this.work(this.ns, targets);

            const workEndTime = new Date();
            this.refreshDashBoard(threadStartTime, workStartTime, workEndTime);

            // refresh targets
            targets = await this.getTargets();

            this.ns.print(Log.getEndLog());

            if (this.needLoop(threadStartTime, targets)) {
                // TODO : adapt waiting time
                // TODO : check repository maj instead || next target time
                // sleep to prevent crash because of infinite loop
                await this.ns.sleep(500);
            }
        } while (this.needLoop(threadStartTime, targets))
    }
    
    private isTimeOut(threadStartTime: Date): boolean {
        return this.durationLimit !== undefined 
            && (new Date().getTime() - threadStartTime.getTime() > this.durationLimit)
    }

    private isTargetOut(targets: T[]): boolean {
        return !(this.waitNewTargets || !this.waitNewTargets && targets.length <= 0)
    }

    killAfterLoop() {
        this.runHasLoop = false;
    }

    needLoop(threadStartTime: Date, targets: T[]): boolean {
        return this.runHasLoop 
            && !this.isTimeOut(threadStartTime) 
            && !this.isTargetOut(targets)
            && !this.isKillConditionReached();
    }

    //#region Dashboard    
    private refreshDashBoard(threadStartTime: Date, workStartTime: Date, workEndTime: Date) {
        const shareDuration = new Date(workEndTime.getTime() - workStartTime.getTime())
        this.ns.print(Log.INFO("Thread start time", Log.time(threadStartTime)));
        this.ns.print(Log.INFO("Last work time",  Log.time(workEndTime)));
        this.ns.print(Log.INFO("Last work duration",  Log.time(shareDuration)));
        this.ns.print('-'.repeat(10));
    }
    //#endregion Dashboard
}