/**
 * Récupération des chemins des fichiers présent dans le dossier ciblé, sur le serveur ciblé.
 * 
 * @param ns Bitburner API
 * @param hostname serveur cible
 * @param directory dossier cible
 * 
 * @remarks RAM cost: 0.2 GB
 */
export function getFilepaths(ns: NS, hostname: string, directory: string) {
	// get filepaths that contain the workspace directory
	return ns.ls(hostname, directory)
		// keep all files in the workspace directory
		.filter(file => file.startsWith(directory))
}
