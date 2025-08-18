import * as Log from 'workspace/frameworks/logging';

/**
 * Execute en boucle une séquence ayant pour ressource le nombre de thread.
 */
export class Daemon {
    private ns: NS;
    private work: () => Promise<any>;
    // TODO : nb loop usefull ?
    private runHasLoop: boolean;
    private durationLimit?: number;

    /**
     * 
     * @param ns Bitburner API
     * @param work execution to loop
     * @param durationLimit maximum duration wanted (in ms)
     */
    constructor(ns: NS, work: () => Promise<any>, durationLimit?: number) {
        this.ns = ns;
        this.work = work;
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
        } while (this.runHasLoop && !this.isTimeOut(threadStartTime))
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
        const shareDuration = new Date(workEndTime.getTime() - workStartTime.getTime())
        this.ns.print(Log.INFO("Thread start time", Log.time(threadStartTime)));
        this.ns.print(Log.INFO("Last work time",  Log.time(workEndTime)));
        this.ns.print(Log.INFO("Last work duration",  Log.time(shareDuration)));
    }
    //#endregion Dashboard
}