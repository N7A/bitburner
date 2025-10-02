import * as Referentiel from 'workspace/common/referentiel'
import { StateRepository } from 'workspace/socle/interface/state-repository';
import { Game } from 'workspace/game/domain/model/Game';

/**
 * Persiste les données de la partie en cours (post installation d'augmentation).
 * 
 * @remarks Ram cost : 0.1 GB
 */
export class GameRepository extends StateRepository<Game> {
    constructor(ns: NS) {
        super(ns, Referentiel.GAME_REPOSITORY);
    }
}