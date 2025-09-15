import * as Referentiel from 'workspace/common/referentiel'
import { StateRepository } from 'workspace/socle/interface/state-repository';
import { Game } from 'workspace/game/domain/model/Game';

//#region Constants
const REFRESH_SCRIPT = 'workspace/game/domain/refresh-game-repository.worker.ts';
//#endregion Constants

/**
 * Persiste les données de la partie en cours (post installation d'augmentation).
 * 
 * @remarks Ram cost : ?.? GB
 */
export class GameRepository extends StateRepository<Game> {
    constructor(ns: NS) {
        super(ns, Referentiel.GAME_REPOSITORY);
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