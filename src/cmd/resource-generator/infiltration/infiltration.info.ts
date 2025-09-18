import * as Log from 'workspace/socle/utils/logging';
import { Info } from 'workspace/socle/interface/info';

/** @param {NS} ns */
export async function main(ns: NS) {
	const input: InputArg = await getInput(ns);
    const info: InfiltrationInfo = new InfiltrationInfo(
		ns, 
		input.location === '--- All ---' ? null : InfiltrationInfo.getLocations(ns).find(x => x.toString() === input.location)
	);

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
        location = await ns.prompt('Merci de renseigner un lieu à infiltrer', { type: "select", choices: ['--- All ---', ...InfiltrationInfo.getLocations(ns)] }) as string
    } else {
        location = (ns.args[0] as string);
    }

    return {
        location: location
    };
}
//#endregion Input parameters

export class InfiltrationInfo extends Info {
	private location: LocationName;

	constructor(ns: NS, location: LocationName) {
        super(ns, location ?? 'All');
		this.location = location;
	}

    printData() {
		if (this.location !== null) {
			this.getMessages(this.location)
				.forEach(message => this.ns.print(message));
		} else {
			InfiltrationInfo.getLocations(this.ns).forEach(location => {
				this.ns.print(Log.getStartLog());
				this.ns.print(Log.title(location));
				this.ns.print('------------');

				this.getMessages(location)
					.forEach(message => this.ns.print(message));
				this.ns.print(Log.getEndLog());
			})
		}
	}

    getMessages(location: LocationName): string[] {
		return [
			Log.INFO("Difficulty", this.ns.infiltration.getInfiltration(location).difficulty),
			Log.INFO("Location", this.ns.infiltration.getInfiltration(location).location.name),
			Log.INFO("City", this.ns.infiltration.getInfiltration(location).location.city),
			Log.INFO("maxClearanceLevel", this.ns.infiltration.getInfiltration(location).maxClearanceLevel),
			Log.INFO("startingSecurityLevel", this.ns.infiltration.getInfiltration(location).startingSecurityLevel),
			Log.title("Reward"),
			Log.INFO("SoARep", this.ns.formatNumber(this.ns.infiltration.getInfiltration(location).reward.SoARep)),
			Log.INFO("sellCash", Log.money(this.ns, this.ns.infiltration.getInfiltration(location).reward.sellCash)),
			Log.INFO("tradeRep", this.ns.formatNumber(this.ns.infiltration.getInfiltration(location).reward.tradeRep))
		]
	}

	// TODO: use repository pour reduire la RAM
	static getLocations(ns: NS): LocationName[] {
		return ns.infiltration.getPossibleLocations().map(x => x.name);
	}

}