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

/**
 * Calcule le hash du contenu d'un fichier.
 * 
 * @param ns Bitburner API
 * @param filepath chemin du fichier cible
 * @returns hash correspondant au contenu du fichier
 * 
 * @remarks RAM cost: 0 GB
 */
export function getHash(ns: NS, filepath: string): number {
    const contents = ns.read(filepath);
    
    return getHashFromContent(contents);
}

/**
 * Calcule le hash d'un texte.
 * 
 * @param ns Bitburner API
 * @param contents texte à hash
 * @returns hash correspondant au texte
 * 
 * @remarks RAM cost: 0 GB
 */
export function getHashFromContent(contents: string): number {
    let hash = 0;
    for (const char of contents) {
        hash = ((hash << 5) - hash) + char.charCodeAt(0);
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

/**
 * Extrait le nom d'un script à partir de son chemin.
 * 
 * @param filePath chemin du fichier cible
 * @returns nom du script
 * 
 * @remarks RAM cost: 0 GB
 */
export function getScriptName(filePath: string): string {
    return filePath.substring(filePath.lastIndexOf('/') + 1, filePath.lastIndexOf('.ts'))
}