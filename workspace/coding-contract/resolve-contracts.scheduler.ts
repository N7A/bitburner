export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);
    
    do {
        const resolvers = ns.ls('home', 'workspace/coding-contract').filter(x => {
            return x.startsWith('workspace/coding-contract/') && x.endsWith('.resolve.ts');
        });
        for(const resolver of resolvers) {
            ns.run(resolver);
        }

        if (input.runHasLoop) {
            // sleep to prevent crash because of infinite loop
            await ns.sleep(1000 * 60 * 1);
        }
	} while (input.runHasLoop)
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
