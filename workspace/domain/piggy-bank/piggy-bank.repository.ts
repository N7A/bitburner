import * as Referentiel from 'workspace/referentiel'
import { Bank } from 'workspace/domain/piggy-bank/model/Bank'
import { RamBank } from 'workspace/domain/piggy-bank/model/RamBank';
import { MoneyBank } from 'workspace/domain/piggy-bank/model/MoneyBank';

const REPOSITORY = Referentiel.REPOSITORIES_DIRECTORY + '/piggy-bank.json';

export class PiggyBankRepository {
    /**
     * Récupère les données enregistrées en base de données.
     * 
     * @param ns Bitburner API
     */
    static get(ns: NS): Bank {
        if (!ns.fileExists(REPOSITORY)) {
            return {moneyBank: undefined, ramBank: undefined};
        }
        return JSON.parse(ns.read(REPOSITORY));
    }

    /**
     * Remet à zéro la base de données avec les données fournis en entrée.
     * 
     * @param ns Bitburner API
     * @param bank
     */
    static save(ns: NS, bank: Bank) {
        ns.write(REPOSITORY, JSON.stringify(bank, null, 4), "w");
    }

    /**
     * Remise à zéro de la base de données.
     * 
     * @param ns Bitburner API
     */
    static reset(ns: NS) {
        const moneyBank: MoneyBank = {
            rateToKeep: 30/100,
            toReserve: 0 * 1000 * 1000
        }
        const ramBank: RamBank = {
            rateToKeep: new Map([
                ['home', 10/100], 
                ['f1rst', 10/100]
            ]),
            toReserve: new Map([
                ['home', 20], 
                ['f1rst', 0]
            ])
        }

        const bank: Bank = {moneyBank: moneyBank, ramBank: ramBank};

        // save data
        PiggyBankRepository.save(ns, bank);
    }
}