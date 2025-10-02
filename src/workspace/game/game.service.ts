//#region Constants
const REFRESH_SCRIPT = 'workspace/game/domain/refresh-game-repository.worker.ts';
//#endregion Constants

/**
 * Persiste les données de la partie en cours (post installation d'augmentation).
 * 
 * @remarks Ram cost : 1 GB
 */
export class GameService {
    private ns: NS;
    
    constructor(ns: NS) {
        this.ns = ns;
    }
    /**
     * Remise à zéro de la base de données.
     * 
     * @param ns Bitburner API
     * 
     * @remarks Ram cost : 1 GB
     */
    refresh(): void {
        this.ns.run(REFRESH_SCRIPT);
    }
    /**
     * Remise à zéro de la base de données.
     * 
     * @param ns Bitburner API
     * 
     * @remarks Ram cost : 1 GB
     */
    reset(): void {
        this.refresh();
    }
}