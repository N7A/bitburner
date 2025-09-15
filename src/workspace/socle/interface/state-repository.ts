import { Logger } from 'workspace/socle/Logger';

/**
 * Persitance d'un objet dans un fichier JSON.
 * Permet de persiter un paramètrage dynamique ou un état évolutif.
 * 
 * @remarks RAM cost : 0.1 GB
 */
export class StateRepository<T> {
    protected readonly REPOSITORY: string;
    protected ns: NS;
    protected logger: Logger;

    constructor(ns: NS, repositoryFilePath: string) {
        this.ns = ns;
        this.logger = new Logger(ns);
        this.REPOSITORY = repositoryFilePath;
    }

    /**
     * Défini les données de base.
     * 
     * @remarks RAM cost : 0.1 GB
     */
    getInitData(): T {
        return {} as T;
    }

    /**
     * Récupère les données enregistrées en base de données.
     * 
     * @remarks RAM cost : 0.1 GB
     */
    getData(): T {
        if (!this.ns.fileExists(this.REPOSITORY)) {
            return this.getInitData();
        }
        
        return JSON.parse(this.ns.read(this.REPOSITORY)) as T;
    }

    /**
     * Remet à zéro la base de données avec les données fournis en entrée.
     * 
     * @param data données à sauvegarder
     * 
     * @remarks RAM cost : 0 GB
     */
    save(data: T) {
        this.resetWith(data);
    }

    /**
     * Remise à zéro de la base de données.
     * 
     * @remarks RAM cost : 0 GB
     */
    reset(): void {
        // save data
        this.resetWith(this.getInitData());
    }
    
    /**
     * Remet à zéro la base de données avec les données fournis en entrée.
     * 
     * @param data données à sauvegarder
     * 
     * @remarks RAM cost : 0 GB
     */
    protected resetWith(data: T) {
        this.logger.trace(`resetWith : ${JSON.stringify(data, null, 4)} on ${this.REPOSITORY}`);

        this.ns.write(this.REPOSITORY, JSON.stringify(data, null, 4), "w");
    }
}