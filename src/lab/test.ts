import * as Log from 'workspace/socle/utils/logging';

export async function main(ns: NS) {
    //ns.print(ns.getRunningScript())
    //ns.print(ns.ps())
    
    //ns.singularity.getDarkwebProgramCost()
    //ns.singularity.createProgram

    //ns.singularity.exportGame();
    
    //showCrimes(ns);
    
    //showFactions(ns);
}

function showCrimes(ns: NS) {
    const getProduction = (gain: number, crime: CrimeType): number => gain / (ns.singularity.getCrimeStats(crime).time / 1000);
    const showProduction = (titre: string, gain: number, crime: CrimeType): void => {
        const production: number = getProduction(gain, crime);
        showIfNeeded(titre, production);
    };
    const showIfNeeded = (titre: string, value: number): void => {
        if (value > 0) {
            ns.tprint(Log.INFO(titre, ns.formatNumber(value)))
        }
    };

    for (const crime of Array.from(new Set(Object.values(ns.enums.CrimeType)))) {
        ns.tprint(Log.getStartLog());
        ns.tprint(Log.title(crime));
        ns.tprint(Log.INFO("Durée", Log.duration(new Date(ns.singularity.getCrimeStats(crime).time))));
        const chance = ns.singularity.getCrimeChance(crime);
        ns.tprint(Log.INFO("Difficulty", ns.singularity.getCrimeStats(crime).difficulty));
        ns.tprint(Log.title('Weights'));
        showIfNeeded("Agility", ns.singularity.getCrimeStats(crime).agility_success_weight);
        showIfNeeded("Charisma", ns.singularity.getCrimeStats(crime).charisma_success_weight);
        showIfNeeded("Defense", ns.singularity.getCrimeStats(crime).defense_success_weight);
        showIfNeeded("Dexterity", ns.singularity.getCrimeStats(crime).dexterity_success_weight);
        showIfNeeded("Hacking", ns.singularity.getCrimeStats(crime).hacking_success_weight);
        showIfNeeded("Strength", ns.singularity.getCrimeStats(crime).strength_success_weight);
        ns.tprint(Log.title('Production'));
        ns.tprint(Log.INFO("Chance", ns.formatPercent(chance)));
        const production = getProduction(ns.singularity.getCrimeStats(crime).money, crime);
        ns.tprint(Log.INFO("Money théorique", Log.money(ns, production) + '/s'));
        ns.tprint(Log.INFO("Money réel", Log.money(ns, production * chance) + '/s'));

        showProduction("Agility", ns.singularity.getCrimeStats(crime).agility_exp, crime);
        showProduction("Charisma", ns.singularity.getCrimeStats(crime).charisma_exp, crime);
        showProduction("Defense", ns.singularity.getCrimeStats(crime).defense_exp, crime);
        showProduction("Dexterity", ns.singularity.getCrimeStats(crime).dexterity_exp, crime);
        showProduction("Hacking", ns.singularity.getCrimeStats(crime).hacking_exp, crime);
        showProduction("Intelligence", ns.singularity.getCrimeStats(crime).intelligence_exp, crime);
        showProduction("Strength", ns.singularity.getCrimeStats(crime).strength_exp, crime);
        showProduction("Karma", ns.singularity.getCrimeStats(crime).karma, crime);
        showProduction("Kills", ns.singularity.getCrimeStats(crime).kills, crime);

        
        ns.tprint(Log.getEndLog());
    }
}

function showFactions(ns: NS) {
    for (const faction of Array.from(new Set(Object.values(ns.enums.FactionName)))) {
        ns.tprint(Log.getStartLog());
        ns.tprint(Log.title(faction));
        ns.tprint(Log.INFO("Requirements", JSON.stringify(ns.singularity.getFactionInviteRequirements(faction), null, 4)));
        ns.tprint(Log.getEndLog());
    }
}