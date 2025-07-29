import * as Log from 'workspace/logging-framework/main'

/**
 * Alerte quand le joueur atteint un certain monant.
 * @param ns Bitburner API
 */
export async function main(ns: NS) {
    const input: InputArg = getInput(ns);

    const startTime: Date = new Date();
    while(ns.getPlayer().money < input.threshold) {
        await ns.sleep(500);
    }
    const endTime: Date = new Date();
    
    const duration = new Date(endTime.getTime() - startTime.getTime())

    ns.alert('Montant ' 
        + Log.money(ns, input.threshold)
        + ' atteint en ' + Log.date(ns, duration) + '\n'
        + '(Demandé à ' + Log.date(ns, startTime) + ')'
    );
}

//#region Input parameters
type InputArg = {
    /** Montant surveillé */
    threshold: number;
}

/**
 * Load input parameters
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
    if (!ns.args[0]) {
        ns.tprint('ERROR', ' ', 'Merci de renseigner un montant à notifier');
        ns.exit();
    }
    
    return {
        threshold: (ns.args[0] as number)
    };
}
//#endregion Input parameters
