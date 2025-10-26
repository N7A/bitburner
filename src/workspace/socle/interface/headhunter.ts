import * as Log from 'workspace/socle/utils/logging';
import * as Properties from 'workspace/socle/application-properties'
import { Logger } from 'workspace/socle/Logger';

/**
 * Execute en boucle une séquence ayant pour ressource une cible.
 */
export class Headhunter<T> {
    //#region input parameters
    /** loop frequency time */
    readonly REFRESH_INTERVAL: number = Properties.defaultInterval;
    //#endregion input parameters

    protected ns: NS;
    protected logger: Logger
    private waitNewTargets: boolean;
    private runHasLoop: boolean = true;
    private durationLimit?: number;

    /**
     * 
     * @param ns Bitburner API
     * @param work execution to loop
     * @param durationLimit maximum duration wanted (in ms)
     */
    constructor(
        ns: NS, 
        waitNewTargets: boolean, 
        durationLimit?: number
    ) {
        this.ns = ns;
        this.logger = new Logger(ns);
        this.waitNewTargets = waitNewTargets;
        this.durationLimit = durationLimit;
    }
    
    async run() {
        const threadStartTime: Date = new Date();

        let targets: T[];

        do {
            const workStartTime = new Date();

            // refresh targets
            targets = await this.getTargets();
            if (this.waitNewTargets && targets !== undefined) {
                this.logger.info(Log.INFO('Nombre de cibles restantes', targets.length));
            }

            const message = targets?.length < 10 ? JSON.stringify(targets) : `(${targets.length})`
            this.logger.info(Log.INFO('Selected targets', message));

            await this.work(targets);

            const workEndTime = new Date();
            this.refreshDashBoard(threadStartTime, workStartTime, workEndTime);

            if (this.needLoop(threadStartTime, targets)) {
                // TODO : adapt waiting time
                // TODO : check repository maj instead || next target time
                // sleep to prevent crash because of infinite loop
                await this.ns.asleep(this.REFRESH_INTERVAL);
            }
        } while (this.needLoop(threadStartTime, targets))

        if(this.isTargetOut(targets)) {
            this.logger.success('No more targets');
        }
    }

    protected async work(targets: T[]): Promise<any> {}

    protected async getTargets(): Promise<T[]> {
        return [];
    }

    isKillConditionReached(): boolean {
        return false;
    }

    private isTimeOut(threadStartTime: Date): boolean {
        return this.durationLimit !== undefined 
            && (new Date().getTime() - threadStartTime.getTime() > this.durationLimit)
    }

    private isTargetOut(targets: T[]): boolean {
        return !this.waitNewTargets && targets.length <= 0
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
    protected refreshDashBoard(threadStartTime: Date, workStartTime: Date, workEndTime: Date) {
        this.logger.info(Log.getStartLog());
        const shareDuration = new Date(workEndTime.getTime() - workStartTime.getTime())
        this.logger.info(Log.INFO("Thread start time", Log.time(threadStartTime)));
        this.logger.info(Log.INFO("Last work time",  Log.time(workEndTime)));
        this.logger.info(Log.INFO("Last work duration",  Log.duration(shareDuration)));
        this.logger.info('-'.repeat(10));
        this.logger.info(Log.getEndLog());
    }
    //#endregion Dashboard
}