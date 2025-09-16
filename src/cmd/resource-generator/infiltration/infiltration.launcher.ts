
/** @param {NS} ns */
export async function main(ns: NS) {
    const input: InputArg = await getInput(ns);
    const info: Infiltration = new Infiltration(ns, ns.infiltration.getPossibleLocations().find(x => x.name === input.location));

    info.run();
}

//#region Input parameters
type InputArg = {
    location: string;
}

/**
 * Load input parameters
 * @param ns Bitburner API
 * @returns 
 */
async function getInput(ns: NS): Promise<InputArg> {
    let location: string;
    if (ns.args[0] === undefined) {            
        location = await ns.prompt('Merci de renseigner un montant à notifier', { type: "select", choices: ns.infiltration.getPossibleLocations().map(x => x.name) }) as string
    } else {
        location = (ns.args[0] as string);
    }

    return {
        location: location
    };
}
//#endregion Input parameters

class Infiltration {
    private ns: NS;
	private location: ILocation;

	constructor(ns: NS, location: ILocation) {
        this.ns = ns;
		this.location = location;
	}

    run() {
        if (this.ns.getPlayer().city != this.location.city) {
            this.ns.singularity.travelToCity(this.location.city);
        }
        if (this.ns.getPlayer().location != this.location.name) {
            this.ns.singularity.goToLocation(this.location.name);
        }
    }
}