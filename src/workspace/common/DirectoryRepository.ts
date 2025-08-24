import { getFilepaths } from 'workspace/frameworks/file';

/**
 * 
 * @remarks RAM cost : 0.1 GB
 */
export class DirectoryRepository<T> {
    protected REPOSITORY: string;
    static readonly REPOSITORY_SERVER = 'home';
    static readonly ARCHIVE_DIRECTORY = 'archive';

    protected ns: NS;

    // TODO: call run repositoryworker with queue handler
    constructor(ns: NS) {
        this.ns = ns;
    }

    /**
     * Récupère les données enregistrées en base de données.
     * 
     * @remarks RAM cost : 0.2 GB
     */
    getAllIds(): string[] {
        return getFilepaths(this.ns, DirectoryRepository.REPOSITORY_SERVER, this.REPOSITORY)
                .filter(x => !x.startsWith(`${this.REPOSITORY}/${DirectoryRepository.ARCHIVE_DIRECTORY}/`))
                .map(x => x.substring(x.lastIndexOf('/')+1, x.lastIndexOf('.json')));
    }

    /**
     * Récupère les données du serveurs.
     * 
     * @param ns Bitburner API
     * 
     * @remarks Ram cost : 0.1 GB
     */
    get(id: string): T | null {
        if (!this.ns.fileExists(this.REPOSITORY + '/' + id + '.json', DirectoryRepository.REPOSITORY_SERVER)) {
            return null;
        }
        return JSON.parse(this.ns.read(this.REPOSITORY + '/' + id + '.json'));
    }

    /**
     * Enregistre en base une nouvelle donnée.
     * 
     * @param data nouvelle donnée
     * 
     * @remarks RAM cost : 0.1 GB
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
     * @remarks Ram cost : 2.2 GB
     */
    reset() {
        const ids: string[] = this.getAllIds();
        for (const id of ids) {
            this.ns.mv(DirectoryRepository.ARCHIVE_DIRECTORY, `${this.REPOSITORY}/${id}.json`, `${this.REPOSITORY}/${DirectoryRepository.ARCHIVE_DIRECTORY}/${id}.json`)
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
        this.ns.write(`${this.REPOSITORY}/${id}.json`, JSON.stringify(data, null, 4), "w");
    }
}