import { PiggyBankRepository } from "workspace/piggy-bank/domain/piggy-bank.repository";
import { MoneyNeeder } from "workspace/piggy-bank/domain/model/MoneyBank";

/**
 * Exposition des services money piggy bank.
 * 
 * @remarks — Ram cost : 0.1 GB
 */
export class MoneyPiggyBankService {

    private repository: PiggyBankRepository;

    constructor(ns: NS) {
        this.repository = new PiggyBankRepository(ns);
    }

    /**
     * Retourne la quantité d'argent autorisé à être dépensé.
     * 
     * @remarks — Ram cost : 0.1 GB
     */
    getDisponibleMoney(currentMoney: number, type?: MoneyNeeder): number {
        const available: number = currentMoney - this.getReserveMoney(currentMoney);
        const totalWeight = Object.keys(MoneyNeeder)
            .map(x => (this.repository.get().moneyBank.repartitionByType as Map<MoneyNeeder, number>).get(MoneyNeeder[x]))
            .reduce((a,b) => a+b);
        const ratio = type ? 
            (this.repository.get().moneyBank.repartitionByType as Map<MoneyNeeder, number>).get(type) / totalWeight
            : 1
        return available * ratio;
    }

    /**
     * Retourne la quantité d'argent à garder.
     * 
     * @remarks — Ram cost : 0.1 GB
     */
    getReserveMoney(currentMoney: number): number {
        return Math.max(currentMoney * this.repository.get().moneyBank.rateToKeep, this.repository.get().moneyBank.toReserve);
    }

    /**
     * Défini la quantité d'argent à garder.
     * 
     * @remarks — Ram cost : 0.1 GB
     */
    setReserveMoney(amount: number) {
        let bank = this.repository.get();
        bank.moneyBank.toReserve = amount;
        this.repository.save(bank);
    }

}