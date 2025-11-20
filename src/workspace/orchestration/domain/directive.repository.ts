import * as Referentiel from 'workspace/common/referentiel'
import { StateRepository } from 'workspace/socle/interface/state-repository';
import { Directive } from 'workspace/orchestration/domain/model/Directive';

/**
 * Persiste les ressources recherchées.
 * 
 * @remarks Ram cost : 0.1 GB
 */
export class DirectiveRepository extends StateRepository<Directive> {
    constructor(ns: NS) {
        super(ns, Referentiel.DIRECTIVE_REPOSITORY);
    }
}