import * as Referentiel from 'workspace/common/referentiel'
import { DirectoryRepository } from 'workspace/socle/interface/directory-repository';
import { FailedContract } from 'workspace/resource-generator/coding-contract/domain/model/FailedContract';

const REPOSITORY = Referentiel.FAILED_CONTRACTS_REPOSITORY;

/**
 * Recense les contrats dont la résolution à échoué.
 * 
 * @remarks RAM cost: 2.3 GB
 */
export class RejetsRepository extends DirectoryRepository<FailedContract> {
    
    /**
     * 
     * @param ns Bitburner API
     */
    constructor(ns: NS) {
        super(ns, REPOSITORY);
    }

    /**
     * Enregistre en base un nouveau serveur.
     * 
     * @param ns Bitburner API
     * @param hostname serveur qui porte l'execution
     * @param execution nouvelle execution
     * 
     * @remarks Ram cost : 2 GB
     */
    add(filepath: string, failedContract: FailedContract) {
        // save data
        this.resetWith(filepath, failedContract);
    }

    remove(filepath: string) {
        this.ns.rm(`${REPOSITORY}/${filepath}.json`)
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
            this.ns.mv('home', `${REPOSITORY}/${id}.json`, `${REPOSITORY}/${DirectoryRepository.ARCHIVE_DIRECTORY}/${id}.json`)
        }
    }
}