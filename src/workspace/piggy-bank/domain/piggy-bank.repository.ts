import * as Referentiel from 'workspace/referentiel'
import { Bank } from 'workspace/piggy-bank/domain/model/Bank'
import { RamBank } from 'workspace/piggy-bank/domain/model/RamBank';
import { MoneyBank } from 'workspace/piggy-bank/domain/model/MoneyBank';

const REPOSITORY = Referentiel.REPOSITORIES_DIRECTORY + '/piggy-bank.json';

/**
 * Persiste les seuils de dépense (en argent et RAM).
 * 
 * @remarks Ram cost : 0.1 GB
 */
export class PiggyBankRepository {

    private ns: NS;

    constructor(ns: NS) {
        this.ns = ns
    }

    /**
     * Récupère les données enregistrées en base de données.
     * 
     * @param ns Bitburner API
     * 
     * @remarks Ram cost : 0.1 GB
     */
    get(): Bank {
        if (!this.ns.fileExists(REPOSITORY)) {
            return {moneyBank: {rateToKeep:0, toReserve: 0}, ramBank: {rateToKeep: new Map(), toReserve: new Map()}};
        }
        let bank: Bank = JSON.parse(this.ns.read(REPOSITORY));
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
     * @param bank data to save
     * 
     * @remarks Ram cost : 0 GB
     */
    save(bank: Bank): void {
        // conversion des maps en objet (nécessaire pour l'enregistrement au format JSON)
        bank.ramBank.rateToKeep = Object.fromEntries(bank.ramBank.rateToKeep as Map<string, number>);
        bank.ramBank.toReserve = Object.fromEntries(bank.ramBank.toReserve as Map<string, number>);
        // save data
        this.ns.write(REPOSITORY, JSON.stringify(bank, null, 4), "w");
    }

    /**
     * Remise à zéro de la base de données.
     * 
     * @param ns Bitburner API
     * 
     * @remarks Ram cost : 0 GB
     */
    reset(): void {
        // initial money thresholds
        const moneyBank: MoneyBank = {
            rateToKeep: 30/100,
            toReserve: 0 * 1000 * 1000
        };
        // initial RAM thresholds
        const ramBank: RamBank = {
            rateToKeep: new Map([
                ['home', 10/100], 
                ['f1rst', 10/100]
            ]),
            toReserve: new Map([
                ['home', 20], 
                ['f1rst', 0]
            ])
        };

        const bank: Bank = {moneyBank: moneyBank, ramBank: ramBank};

        // save data
        this.save(bank);
    }
    
}