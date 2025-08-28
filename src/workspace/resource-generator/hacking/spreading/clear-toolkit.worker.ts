import * as Referentiel from 'workspace/referentiel'
import { getFilepaths } from 'workspace/socle/utils/file'

//#region Constants
const WORKSPACE_DIRECTORY = Referentiel.WORKSPACE_DIRECTORY;
const CMD_DIRECTORY = Referentiel.CMD_DIRECTORY;
//#endregion Constants

/**
 * Delete all toolkit script from target host.
 * 
 * L'execution de script nécessite que les fichiers de script soient sur le serveur.
 * ns.read et ns.write cible toujours "home", les repositories ne doivent pas être sur les serveurs distants.
 * 
 * RAM : 2,80GB
 */
export async function main(ns: NS) {
    // load input arguments
	const input: InputArg = getInput(ns);

	// get all workspace filepaths
	[
		...getFilepaths(ns, input.hostnameTarget, WORKSPACE_DIRECTORY), 
		...getFilepaths(ns, input.hostnameTarget, CMD_DIRECTORY)
	]
        // delete all
        .forEach(x => ns.rm(x, input.hostnameTarget));
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
function getInput(ns: NS): InputArg {
	if (!ns.args[0]) {
		ns.tprint('ERROR', ' ', 'Merci de renseigner un hostname');
		ns.exit();
	}

	return {
		hostnameTarget: (ns.args[0] as string)
	};
}
//#endregion Input arguments
