/**
 * Repository Git stockant des scripts à synchroniser.
 */
export type GitRepository = {
    /** Url du repository GitHub */
    baseUrl: string,
    /** Chemin vers le fichier recensant les fichiers à télécharger */
    manifestFilepath: string,
    /** Chemin vers le dossier source sur GitHub */
    sourceDirectoryPath: string
}