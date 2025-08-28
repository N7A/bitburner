import * as Log from 'workspace/socle/logging';

/**
 * Execute en boucle une séquence ayant pour ressource le nombre de thread.
 */
export class Daemon {
    protected ns: NS;
    // TODO : nb loop usefull ?
    private runHasLoop: boolean = true;
    private durationLimit?: number;

    /**
     * 
     * @param ns Bitburner API
     * @param work execution to loop
     * @param durationLimit maximum duration wanted (in ms); endless if undefined
     */
    constructor(ns: NS, durationLimit?: number) {
        this.ns = ns;
        this.durationLimit = durationLimit;
    }
    
    async run() {
        const threadStartTime = new Date();

        do {
            this.ns.print(Log.getStartLog());

            const workStartTime = new Date();

            await this.work();

            const workEndTime = new Date();
            this.refreshDashBoard(threadStartTime, workStartTime, workEndTime);

            this.ns.print(Log.getEndLog());
        } while (this.runHasLoop && !this.isTimeOut(threadStartTime) && !this.isKillConditionReached())
    }

    async work(): Promise<any> {}
    
    isKillConditionReached(): boolean {
        return false;
    }
    
    private isTimeOut(threadStartTime: Date): boolean {
        return this.durationLimit !== undefined 
            && (new Date().getTime() - threadStartTime.getTime() > this.durationLimit)
    }

    killAfterLoop() {
        this.runHasLoop = false;
    }

    //#region Dashboard    
    private refreshDashBoard(threadStartTime: Date, workStartTime: Date, workEndTime: Date) {
        const workDuration = new Date(workEndTime.getTime() - workStartTime.getTime())
        this.ns.print(Log.INFO("Thread start time", Log.time(threadStartTime)));
        this.ns.print(Log.INFO("Last work time",  Log.time(workEndTime)));
        this.ns.print(Log.INFO("Last work duration",  Log.time(workDuration)));
    }
    //#endregion Dashboard
}