import { Headhunter } from 'workspace/socle/interface/headhunter';
import { getBestWork } from 'workspace/resource-generator/job/job.selector';
import { JobOrder } from 'workspace/resource-generator/job/model/JobOrder';

/**
 * 
 * @requires singularity
 * @param ns 
 */
export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);
    
    // waitNewTargets = true : contracts appear over the time
    const daemon = new Main(ns);
    
    if (!input.runHasLoop) {
        daemon.killAfterLoop();
    }
    
    await daemon.run();
}

//#region Input arguments
type InputArg = {
	/** Serveur cible */
	runHasLoop: boolean;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
	return {
		runHasLoop: ns.args[0] ? (ns.args[0] as boolean) : false
	};
}
//#endregion Input arguments

class Main extends Headhunter<JobOrder> {
    private currentWork: JobOrder | undefined;

    constructor(ns: NS) {
        // waitNewTargets = true : contracts appear over the time
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