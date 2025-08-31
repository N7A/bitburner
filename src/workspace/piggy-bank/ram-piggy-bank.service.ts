import { PiggyBankRepository } from "workspace/piggy-bank/domain/piggy-bank.repository";

/**
 * Exposition des services ram piggy bank.
 * 
 * @remarks RAM cost: 0.2 GB
 */
export class RamPiggyBankService {
    
    private ns: NS;
    private repository: PiggyBankRepository;

    constructor(ns: NS) {
        this.ns = ns
        this.repository = new PiggyBankRepository(ns);
    }
    
    /**
     * Retourne la quantité de RAM autorisé à être dépensé.
     * 
     * @remarks RAM cost: 0.1 GB
     */
    getDisponibleRam(hostname: string): number {
        return Math.max(
            this.getCurrentRam(hostname) - this.getReserveRam(hostname),
            0
        );
    }
    
    /**
     * Retourne la quantité d'argent à garder.
     * 
     * @remarks RAM cost: 0.1 GB
     */
    getReserveRam(hostname: string): number {
        return Math.max(
            this.getCurrentRam(hostname) * ((this.repository.get().ramBank.rateToKeep as Map<string, number>).get(hostname) ?? 0), 
            (this.repository.get().ramBank.toReserve as Map<string, number>).get(hostname) ?? 0
        );
    }

    /**
     * Retourne la quantité de RAM actuellement disponible sur un serveur.
     * 
     * @remarks RAM cost: 0.1 GB
     */
    private getCurrentRam(hostname: string) {
        return this.ns.getServerMaxRam(hostname) - this.ns.getServerUsedRam(hostname)
    }

}