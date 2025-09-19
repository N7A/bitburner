import { Headhunter } from 'workspace/socle/interface/headhunter';
import { DirectiveType } from "workspace/resource-generator/infiltration/model/DirectiveType";
import { InfiltrationSelector } from "workspace/resource-generator/infiltration/infiltration.selector";

//#region Constantes
export const MOVE_SCRIPT = 'cmd/resource-generator/infiltration/infiltration.launcher.ts';
//#endregion Constantes

export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);
    
    // waitNewTargets = true : contracts appear over the time
    const daemon = new Main(ns);
    
    if (!input.runHasLoop) {
        daemon.killAfterLoop();
    }
    
    daemon.run();
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
		runHasLoop: ns.args[0] !== undefined ? (ns.args[0] as boolean) : true
	};
}
//#endregion Input arguments

class Main extends Headhunter<ILocation> {
    private selector: InfiltrationSelector;
    private currentBestLocation: ILocation;

    constructor(ns: NS) {
        // waitNewTargets = true : location unlock over the time
        super(ns, true);

        this.selector = new InfiltrationSelector(ns);
    }

    async work(targets: ILocation[]) {
        const newLocation = targets.find(x => x.name !== this.currentBestLocation.name);
        if (newLocation !== undefined) {
            this.currentBestLocation = newLocation;
            const move = await this.ns.prompt(`Nouveau lieu à infiltrer : ${newLocation.name}\n
                Voulez-vous vous y rendre ?`, {type: 'select', choices: ['Oui', 'Non']});
            if (move) {
                this.ns.run(MOVE_SCRIPT)
            }
        }
    }

    async getTargets(): Promise<ILocation[]> {
        const location = this.selector.getBestLocation(DirectiveType.SOA_REPUTATION);
        return location ? [location] : [];
    }

}