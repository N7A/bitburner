import * as Referentiel from 'workspace/common/referentiel'
import { StateRepository } from 'workspace/socle/interface/state-repository';
import { Directive } from 'workspace/orchestration/domain/model/Directive';

/**
 * Persiste les données de la partie en cours (post installation d'augmentation).
 * 
 * @remarks Ram cost : 0.1 GB
 */
export class GameRepository extends StateRepository<Directive> {
    constructor(ns: NS) {
        super(ns, Referentiel.GAME_REPOSITORY);
    }
}