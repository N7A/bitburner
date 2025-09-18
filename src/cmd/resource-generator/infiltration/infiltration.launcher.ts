import { InfiltrationSelector } from "workspace/resource-generator/infiltration/infiltration.selector";
import { DirectiveType } from "workspace/resource-generator/infiltration/model/DirectiveType";

/** @param {NS} ns */
export async function main(ns: NS) {
    const selector: InfiltrationSelector = new InfiltrationSelector(ns);
    // TODO: get directive from parametrage
    const info: Infiltration = new Infiltration(ns, selector.getBestLocation(DirectiveType.SOA_REPUTATION));

    await info.run();
}

class Infiltration {
    private ns: NS;
	private location: ILocation;

	constructor(ns: NS, location: ILocation) {
        this.ns = ns;
		this.location = location;
	}

    async run() {
        this.checkLocation();

        // move to the city
        if (this.ns.getPlayer().city != this.location.city) {
            const payTravel = await this.ns.prompt(`Meilleure infiltration dans une autre ville (${this.location.city}).\n
                Voulez vous payer pour voyager ?`, {type: "boolean"});
            if (payTravel) {
                this.ns.singularity.travelToCity(this.location.city);
            } else {
                const retry = await this.ns.prompt(`Chercher la meilleure infiltration dans la ville actuelle ?`, {type: "boolean"});
                if (!retry) {
                    this.ns.exit();
                }
                const selector: InfiltrationSelector = new InfiltrationSelector(this.ns);
                this.location = selector.getBestLocation(DirectiveType.SOA_REPUTATION, this.ns.getPlayer().city);
                this.checkLocation();
            }
        }

        // move to the location
        if (this.ns.getPlayer().location != this.location.name) {
            this.ns.singularity.goToLocation(this.location.name);
        }

        // TODO: si pas assez d'argent pour heal l'infiltration prévue -> prompt pour valider
        // TODO: give hp lose by fail (this.ns.infiltration.getInfiltration(this.location.name).maxClearanceLevel)
        this.ns.run('cmd/resource-generator/infiltration/auto-heal.daemon.ts');
    }

    private checkLocation() {
        // no best location found
        if (this.location === undefined) {
            this.ns.alert('Aucune infiltration sélectionné par le service.');
            this.ns.exit();
        }
    }
}