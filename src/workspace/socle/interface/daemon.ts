import * as Log from 'workspace/socle/utils/logging';

/**
 * Execute en boucle une séquence ayant pour ressource le nombre de thread.
 * 
 * @remarks RAM cost : 0 GB
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
    
    /**
     * 
     * @remarks RAM cost : 0 GB
     */
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

    /**
     * 
     * @remarks RAM cost : 0 GB
     */
    async work(): Promise<any> {}
    
    /**
     * 
     * @returns 
     * 
     * @remarks RAM cost : 0 GB
     */
    isKillConditionReached(): boolean {
        return false;
    }
    
    /**
     * 
     * @param threadStartTime 
     * @returns 
     * 
     * @remarks RAM cost : 0 GB
     */
    private isTimeOut(threadStartTime: Date): boolean {
        return this.durationLimit !== undefined 
            && (new Date().getTime() - threadStartTime.getTime() > this.durationLimit)
    }

    /**
     * 
     * @remarks RAM cost : 0 GB
     */
    killAfterLoop() {
        this.runHasLoop = false;
    }

    //#region Dashboard
    /**
     * 
     * @param threadStartTime 
     * @param workStartTime 
     * @param workEndTime 
     * 
     * @remarks RAM cost : 0 GB
     */
    private refreshDashBoard(threadStartTime: Date, workStartTime: Date, workEndTime: Date) {
        const workDuration = new Date(workEndTime.getTime() - workStartTime.getTime())
        this.ns.print(Log.INFO("Thread start time", Log.time(threadStartTime)));
        this.ns.print(Log.INFO("Last work time",  Log.time(workEndTime)));
        this.ns.print(Log.INFO("Last work duration",  Log.time(workDuration)));
    }
    //#endregion Dashboard
}