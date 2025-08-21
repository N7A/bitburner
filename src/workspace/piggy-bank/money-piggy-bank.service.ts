import { PiggyBankRepository } from "workspace/piggy-bank/domain/piggy-bank.repository";

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
    getDisponibleMoney(currentMoney: number): number {
        return currentMoney - this.getReserveMoney(currentMoney);
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