import { Headhunter } from 'workspace/socle/interface/headhunter';
import { getBestWork } from 'workspace/resource-generator/job/job.selector';
import { JobOrder } from 'workspace/resource-generator/job/model/JobOrder';
import { DaemonFlags } from 'workspace/common/model/DaemonFlags';

//#region Constantes
const FLAGS_SCHEMA: [string, string | number | boolean | string[]][] = [
    [DaemonFlags.oneshot, false]
];
//#endregion Constantes

/**
 * 
 * @requires singularity
 * @param ns Bitburner API
 */
export async function main(ns: NS) {
    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);
    
    const daemon = new Main(ns);
    
    if (scriptFlags[DaemonFlags.oneshot]) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();
}

class Main extends Headhunter<JobOrder> {
    private currentWork: JobOrder | undefined;

    constructor(ns: NS) {
        // waitNewTargets = true : best work appear over the time
        super(ns, true)
    }

    async work(targets: JobOrder[]) {
        if (targets.length <= 0) {
            return;
        }

        const bestWork = targets[0];

        if (
            this.currentWork === undefined
            || (
                this.currentWork.company === bestWork.company
                && this.currentWork.position === bestWork.position
            )
        ) {
            this.currentWork = bestWork;
            this.ns.singularity.applyToCompany(bestWork.company, bestWork.position.field);
            this.ns.singularity.workForCompany(bestWork.company);
        }
    }

    async getTargets(): Promise<JobOrder[]> {
        return getBestWork(this.ns) ? [getBestWork(this.ns)] : [];
    }

}