import { Logger } from 'workspace/socle/Logger';

/**
 * 
 * @remarks RAM cost : 0.1 GB
 */
export class JsonRepository<T> {
    protected REPOSITORY: string;
    protected ns: NS;
    protected logger: Logger;

    // TODO: call run repositoryworker with queue handler
    constructor(ns: NS) {
        this.ns = ns;
        this.logger = new Logger(ns);
    }

    /**
     * Récupère les données enregistrées en base de données.
     * 
     * @remarks RAM cost : 0.1 GB
     */
    getAll(): T[] {
        if (!this.ns.fileExists(this.REPOSITORY)) {
            return [] as T[];
        }
        
        return JSON.parse(this.ns.read(this.REPOSITORY)) as T[];
    }

    /**
     * Enregistre en base une nouvelle donnée.
     * 
     * @param data nouvelle donnée
     * 
     * @remarks RAM cost : 0.1 GB
     */
    add(data: T) {
        this.logger.trace(`add : ${JSON.stringify(data, null, 4)}`);

        // get last version of executions
        let executions: T[] = this.getAll();

        // add execution
        executions.push(data);

        // save data
        this.resetWith(executions);
    }

    /**
     * Remise à zéro de la base de données.
     * 
     * @remarks RAM cost : 0 GB
     */
    reset(): void {
        // save data
        this.resetWith([] as T[]);
    }
    
    /**
     * Remet à zéro la base de données avec les données fournis en entrée.
     * 
     * @param data données à sauvegarder
     * 
     * @remarks RAM cost : 0 GB
     */
    protected resetWith(data: T[]) {
        this.logger.trace(`resetWith : ${JSON.stringify(data, null, 4)} on ${this.REPOSITORY}`);

        this.ns.write(this.REPOSITORY, JSON.stringify(data, null, 4), "w");
    }
}