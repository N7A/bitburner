import * as Referentiel from 'workspace/referentiel'
import { Bank } from 'workspace/piggy-bank/domain/model/Bank'
import { RamBank } from 'workspace/piggy-bank/domain/model/RamBank';
import { MoneyBank } from 'workspace/piggy-bank/domain/model/MoneyBank';

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
        let bank: Bank = JSON.parse(ns.read(REPOSITORY));
        bank.ramBank = {
            rateToKeep: new Map(Object.entries(bank.ramBank.rateToKeep)),
            toReserve: new Map(Object.entries(bank.ramBank.toReserve))
        }

        return bank;
    }

    /**
     * Remet à zéro la base de données avec les données fournis en entrée.
     * 
     * @param ns Bitburner API
     * @param bank
     */
    static save(ns: NS, bank: Bank) {
        bank.ramBank.rateToKeep = Object.fromEntries(bank.ramBank.rateToKeep as Map<string, number>)
        bank.ramBank.toReserve = Object.fromEntries(bank.ramBank.toReserve as Map<string, number>)
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