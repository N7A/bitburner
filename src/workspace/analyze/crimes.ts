export async function main(ns: NS) {
    for (const crime of Object.values(ns.enums.CrimeType)) {
        ns.tprint(crime)
        ns.tprint('crimeGains ', ns.formulas.work.crimeGains(ns.getPlayer(), crime));
        ns.tprint('crimeSuccessChance ', ns.formulas.work.crimeSuccessChance(ns.getPlayer(), crime));
        //ns.prompt('How much time it take', {type: "text"});
        ns.tprint('-----')
    }
}