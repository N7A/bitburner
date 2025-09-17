
/** @param {NS} ns */
export async function main(ns: NS) {
    const input: InputArg = await getInput(ns);
    const info: Infiltration = new Infiltration(ns, ns.infiltration.getPossibleLocations().find(x => x.name === input.location));

    await info.run();
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

    async run() {
        if (this.ns.getPlayer().city != this.location.city) {
            const payTravel = await this.ns.prompt(`Meilleure infiltration dans une autre ville (${this.location.city}).\n
                Voulez vous payer pour voyager ?`, {type: "boolean"});
            if (payTravel) {
                this.ns.singularity.travelToCity(this.location.city);
            } else {   
                //const retry = await this.ns.prompt(`Chercher la meilleure infiltration dans la ville actuelle ?`, {type: "boolean"});
                this.ns.exit();
            }
        }
        if (this.ns.getPlayer().location != this.location.name) {
            this.ns.singularity.goToLocation(this.location.name);
        }

        // TODO: si pas assez d'argent pour heal l'infiltration prévue -> prompt pour valider
        // TODO: give hp lose by fail (this.ns.infiltration.getInfiltration(this.location.name).maxClearanceLevel)
        this.ns.run('cmd/resource-generator/infiltration/auto-heal.daemon.ts');
    }
}