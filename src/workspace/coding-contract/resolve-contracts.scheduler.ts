import * as Log from 'workspace/frameworks/logging';

//#region Constantes
const selectTarget = (ns: NS) => {
    return ns.ls('home', 'workspace/coding-contract').filter(x => {
            return x.startsWith('workspace/coding-contract/') && x.endsWith('.resolve.ts');
        });
}
const work = async (ns: NS, targets: string[]) => {
    for(const resolver of targets) {
        ns.run(resolver);
    }
}
const isKillConditionReached = (): boolean => {
    // contracts appear over the time
    return false
}
//#endregion Constantes

export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);
    
    do {
        ns.print(Log.getStartLog());
        const resolvers = selectTarget(ns);

        await work(ns, resolvers);

        ns.print(Log.getEndLog());

        if (input.runHasLoop) {
            // TODO : adapt waiting time
            // sleep to prevent crash because of infinite loop
            await ns.sleep(1000 * 60 * 1);
        }
	} while (input.runHasLoop && !isKillConditionReached())
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
