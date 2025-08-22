export class JsonRepository<T> {
    protected REPOSITORY: string;
    private ns: NS;

    constructor(ns: NS) {
        this.ns = ns;
    }

    /**
     * Récupère les données enregistrées en base de données.
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
     */
    add(data: T) {
        // get last version of executions
        let executions: T[] = this.getAll();

        // add execution
        executions.push(data);

        // save data
        this.resetWith(executions);
    }

    /**
     * Remise à zéro de la base de données.
     */
    reset(): void {
        // save data
        this.resetWith([] as T[]);
    }
    
    /**
     * Remet à zéro la base de données avec les données fournis en entrée.
     * 
     * @param data données à sauvegarder
     */
    protected resetWith(data: T[]) {
        this.ns.write(this.REPOSITORY, JSON.stringify(data, null, 4), "w");
    }
}