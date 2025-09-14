import { getFilepaths } from 'workspace/socle/utils/file';
import * as Referentiel from 'workspace/common/referentiel'

/**
 * Persistance de donnée dans un dossier, avec chaque fichier JSON correspondant à une entrée.
 * 
 * @param T type d'une entrée
 * @remarks RAM cost : 0.3 GB
 */
export class DirectoryRepository<T> {
    readonly REPOSITORY_EXTENSION: string = '.json';

    protected REPOSITORY: string;
    static readonly REPOSITORY_SERVER = Referentiel.MAIN_HOSTNAME;
    static readonly ARCHIVE_DIRECTORY = 'archive';

    protected ns: NS;

    /**
     * Persistance de donnée dans un dossier, avec chaque fichier JSON correspondant à une entrée.
     * 
     * @param ns Bitburner API
     * @param repositoryPath chemin du dossier où stocker la base de donnée
     */
    constructor(ns: NS, repositoryPath: string) {
        this.ns = ns;
        this.REPOSITORY = repositoryPath;
    }

    /**
     * Récupère les données enregistrées en base de données.
     * 
     * @remarks RAM cost : 0.2 GB
     */
    getAllIds(): string[] {
        return getFilepaths(this.ns, DirectoryRepository.REPOSITORY_SERVER, this.REPOSITORY)
                .filter(x => !x.startsWith(`${this.REPOSITORY}/${DirectoryRepository.ARCHIVE_DIRECTORY}/`))
                .map(x => x.substring(x.lastIndexOf('/')+1, x.lastIndexOf(this.REPOSITORY_EXTENSION)));
    }

    /**
     * Récupère les données enregistrées en base de données.
     * 
     * @remarks RAM cost : 0.2 GB
     */
    getAll(): T[] {
        return this.getAllIds()
                .map(id => JSON.parse(this.ns.read(`${this.REPOSITORY}/${id}${this.REPOSITORY_EXTENSION}`)));
    }

    /**
     * Récupère les données du serveurs.
     * 
     * @param ns Bitburner API
     * 
     * @remarks Ram cost : 0.1 GB
     */
    get(id: string): T | null {
        if (!this.ns.fileExists(`${this.REPOSITORY}/${id}${this.REPOSITORY_EXTENSION}`, DirectoryRepository.REPOSITORY_SERVER)) {
            return null;
        }
        return JSON.parse(this.ns.read(`${this.REPOSITORY}/${id}${this.REPOSITORY_EXTENSION}`));
    }

    /**
     * Enregistre en base une nouvelle donnée.
     * 
     * @param data nouvelle donnée
     * 
     * @remarks RAM cost : 0 GB
     */
    add(id: string, ...data: any) {}

    /**
     * Enregistre en base la mise à jour d'une donnée.
     * 
     * @param ns Bitburner API
     * @param server serveur à mettre à jour
     * 
     * @remarks Ram cost : 0 GB
     */
    save(id: string, data: T) {
        // save data
        this.resetWith(id, data);
    }

    /**
     * Remise à zéro de la base de données.
     * 
     * @param ns Bitburner API
     * 
     * @remarks Ram cost : 0.2 GB
     */
    reset() {
        const ids: string[] = this.getAllIds();
        for (const id of ids) {
            this.ns.mv(
                DirectoryRepository.REPOSITORY_SERVER, 
                `${this.REPOSITORY}/${id}${this.REPOSITORY_EXTENSION}`, 
                `${this.REPOSITORY}/${DirectoryRepository.ARCHIVE_DIRECTORY}/${id}${this.REPOSITORY_EXTENSION}`
            );
        }
    }
    
    /**
     * Remet à zéro la base de données avec les données fournis en entrée.
     * 
     * @param data données à sauvegarder
     * 
     * @remarks RAM cost : 0 GB
     */
    protected resetWith(id: string, data: T) {
        this.ns.write(`${this.REPOSITORY}/${id}${this.REPOSITORY_EXTENSION}`, JSON.stringify(data, null, 4), "w");
    }
}