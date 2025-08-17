import * as Log from 'workspace/frameworks/logging';

export class Daemon {
    private ns: NS;
    private work: () => Promise<any>;
    private runHasLoop: boolean;

    constructor(ns: NS, work: () => Promise<any>) {
        this.ns = ns;
        this.work = work;
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
        } while (this.runHasLoop)
    }
    
    killAfterLoop() {
        this.runHasLoop = false;
    }

    //#region Dashboard    
    private refreshDashBoard(threadStartTime: Date, workStartTime: Date, workEndTime: Date) {
        const shareDuration = new Date(workEndTime.getTime() - workStartTime.getTime())
        this.ns.print(Log.INFO("Thread start time : ", Log.time(threadStartTime)));
        this.ns.print(Log.INFO("Last work time : ",  Log.time(workEndTime)));
        this.ns.print(Log.INFO("Last work duration : ",  Log.time(shareDuration)));
    }
    //#endregion Dashboard
}