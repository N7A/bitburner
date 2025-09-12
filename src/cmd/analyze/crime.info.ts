import * as Log from 'workspace/socle/utils/logging';
import { Info } from 'workspace/socle/interface/info';

/** @param {NS} ns */
export async function main(ns: NS) {
	const input: InputArg = await getInput(ns);
    const info: CrimeInfo = new CrimeInfo(ns, Object.values(ns.enums.CrimeType).find(x => x.toString() === input.crime));

    info.run();
}

//#region Input parameters
type InputArg = {
    crime: string;
}

/**
 * Load input parameters
 * @param ns Bitburner API
 * @returns 
 */
async function getInput(ns: NS): Promise<InputArg> {
    let crime: string;
    if (ns.args[0] === undefined) {            
        crime = await ns.prompt('Merci de renseigner un montant à notifier', { type: "select", choices: CrimeInfo.getCrimes(ns) }) as string
    } else {
        crime = (ns.args[0] as string);
    }

    return {
        crime: crime
    };
}
//#endregion Input parameters

class CrimeInfo extends Info {
	private crime: CrimeType;

	constructor(ns: NS, crime: CrimeType) {
        super(ns, crime);
		this.crime = crime;
	}

    printData() {
		this.ns.tprint(Log.title(this.crime));
		this.showFormulasData();
		this.ns.print('\n')
		this.showSingularityData();
	}

	showFormulasData() {
		this.ns.print(Log.title('Formulas'));
		this.ns.print(Log.INFO("Gains", this.ns.formulas.work.crimeGains(this.ns.getPlayer(), this.crime)));
		this.ns.print(Log.INFO("SuccessChance", this.ns.formulas.work.crimeSuccessChance(this.ns.getPlayer(), this.crime)));
	}

	showSingularityData() {
		this.ns.print(Log.title('Singularity'));
		this.ns.print(Log.INFO("Durée", Log.duration(new Date(this.ns.singularity.getCrimeStats(this.crime).time))));
		this.ns.print(Log.INFO("Difficulty", this.ns.singularity.getCrimeStats(this.crime).difficulty));
		this.showSingularityWeights();
		this.showSingularityProduction();
	}

	showSingularityWeights() {
		this.ns.print(Log.title('Weights'));
		this.showIfNeeded("Agility", this.ns.singularity.getCrimeStats(this.crime).agility_success_weight);
		this.showIfNeeded("Charisma", this.ns.singularity.getCrimeStats(this.crime).charisma_success_weight);
		this.showIfNeeded("Defense", this.ns.singularity.getCrimeStats(this.crime).defense_success_weight);
		this.showIfNeeded("Dexterity", this.ns.singularity.getCrimeStats(this.crime).dexterity_success_weight);
		this.showIfNeeded("Hacking", this.ns.singularity.getCrimeStats(this.crime).hacking_success_weight);
		this.showIfNeeded("Strength", this.ns.singularity.getCrimeStats(this.crime).strength_success_weight);
	}

	showSingularityProduction() {
		const chance = this.ns.singularity.getCrimeChance(this.crime);
		this.ns.print(Log.title('Production'));
		this.ns.print(Log.INFO("Chance", this.ns.formatPercent(chance)));
		const production = this.getProduction(this.ns.singularity.getCrimeStats(this.crime).money, this.crime);
		this.ns.print(Log.INFO("Money théorique", Log.money(this.ns, production) + '/s'));
		this.ns.print(Log.INFO("Money réel", Log.money(this.ns, production * chance) + '/s'));
		this.showProduction("Agility", this.ns.singularity.getCrimeStats(this.crime).agility_exp, this.crime);
		this.showProduction("Charisma", this.ns.singularity.getCrimeStats(this.crime).charisma_exp, this.crime);
		this.showProduction("Defense", this.ns.singularity.getCrimeStats(this.crime).defense_exp, this.crime);
		this.showProduction("Dexterity", this.ns.singularity.getCrimeStats(this.crime).dexterity_exp, this.crime);
		this.showProduction("Hacking", this.ns.singularity.getCrimeStats(this.crime).hacking_exp, this.crime);
		this.showProduction("Intelligence", this.ns.singularity.getCrimeStats(this.crime).intelligence_exp, this.crime);
		this.showProduction("Strength", this.ns.singularity.getCrimeStats(this.crime).strength_exp, this.crime);
		this.showProduction("Karma", this.ns.singularity.getCrimeStats(this.crime).karma, this.crime);
		this.showProduction("Kills", this.ns.singularity.getCrimeStats(this.crime).kills, this.crime);
	}

	getProduction = (gain: number, crime: CrimeType): number => gain / (this.ns.singularity.getCrimeStats(crime).time / 1000);
	showProduction = (titre: string, gain: number, crime: CrimeType): void => {
		const production: number = this.getProduction(gain, crime);
		this.showIfNeeded(titre, production);
	};
	showIfNeeded = (titre: string, value: number): void => {
		if (value > 0) {
			this.ns.tprint(Log.INFO(titre, this.ns.formatNumber(value)))
		}
	};
	// TODO: use repository pour reduire la RAM
	static getCrimes(ns: NS): CrimeType[] {
		return Array.from(new Set(Object.values(ns.enums.CrimeType)));
	}

}