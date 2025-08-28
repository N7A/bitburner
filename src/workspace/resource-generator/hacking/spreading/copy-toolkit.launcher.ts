import * as Referentiel from 'workspace/referentiel'
import { waitEndExecution } from 'workspace/socle/utils/execution'

//#region Constants
const CLEAR_SCRIPT = Referentiel.HACKING_DIRECTORY + '/spreading/clear-toolkit.worker.ts';
const COPY_SCRIPT = Referentiel.HACKING_DIRECTORY + '/spreading/copy-toolkit.worker.ts';
//#endregion Constants

/**
 * Delete workspace on target host,
 * then copy all script from home workspace to target host.
 * 
 * @param ns Bitburner API
 * @param hostnameTarget Serveur cible
 * 
 * RAM : 1,10GB
 */
export async function main(ns: NS, hostnameTarget: string) {
    // load input arguments
	const input: InputArg = getInput(ns, hostnameTarget);

    // TODO : waitEndExecution exit script -> copie pas faite
    // copie du toolkit
    var pidClear: number = ns.run(CLEAR_SCRIPT, 1, input.hostnameTarget);
    // attendre la copie du toolkit
    await waitEndExecution(ns, pidClear);

    // copie du toolkit
    var pidCopy: number = ns.run(COPY_SCRIPT, 1, input.hostnameTarget);
    // attendre la copie du toolkit
    await waitEndExecution(ns, pidCopy);
}

//#region Input arguments
type InputArg = {
	/** Serveur cible */
	hostnameTarget: string;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS, hostnameTarget: string): InputArg {
	if (!hostnameTarget && !ns.args[0]) {
		ns.tprint('ERROR', ' ', 'Merci de renseigner un hostname');
		ns.exit();
	}

	return {
		hostnameTarget: hostnameTarget ?? (ns.args[0] as string)
	};
}
//#endregion Input arguments
