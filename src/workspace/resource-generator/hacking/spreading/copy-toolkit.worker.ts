import * as Referentiel from 'workspace/referentiel'
import { getFilepaths } from 'workspace/socle/file'

//#region Constants
const WORKSPACE_DIRECTORY = Referentiel.WORKSPACE_DIRECTORY;
const CMD_DIRECTORY = Referentiel.CMD_DIRECTORY;
const DIRECTORIES_SOURCE_HOSTNAME = 'home';
//#endregion Constants

/**
 * Copy all script from home toolkit to target host.
 * 
 * L'execution de script nécessite que les fichiers de script soient sur le serveur.
 * ns.read et ns.write cible toujours "home", les repositories ne doivent pas être sur les serveurs distants.
 * 
 * RAM : 2,40GB
 */
export async function main(ns: NS) {
    // load input arguments
	const request: Request = loadRequest(ns);

	work(ns, request);
}

function work(ns: NS, request: Request) {
	// copy home
	ns.scp(
		// get all workspace filepaths
		[
			// workspace
			...getFilepaths(ns, DIRECTORIES_SOURCE_HOSTNAME, WORKSPACE_DIRECTORY),
			// cmd
			...getFilepaths(ns, DIRECTORIES_SOURCE_HOSTNAME, CMD_DIRECTORY),
			// TODO : temporaire, pas de sync disponible
			// repositories
			...getFilepaths(ns, DIRECTORIES_SOURCE_HOSTNAME, Referentiel.REPOSITORIES_DIRECTORY)
		],
		// to target hostname
		request.hostnameTarget,
		// from home
		DIRECTORIES_SOURCE_HOSTNAME
	)
}

//#region Input arguments
type Request = {
	/** Serveur cible */
	hostnameTarget: string;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function loadRequest(ns: NS): Request {
	if (!ns.args[0]) {
		ns.tprint('ERROR', ' ', 'Merci de renseigner un hostname');
		ns.exit();
	}

	return {
		hostnameTarget: (ns.args[0] as string)
	};
}
//#endregion Input arguments
