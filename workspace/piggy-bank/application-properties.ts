import { PiggyBankRepository } from "workspace/domain/piggy-bank/piggy-bank.repository";

export enum MoneyNeeder {
    HACKNET,
    SERVERS
}

export class Money {
    static getDisponibleMoney(ns: NS, currentMoney: number): number {
        return currentMoney - Money.getReserveMoney(ns, currentMoney);
    }
    static getReserveMoney(ns: NS, currentMoney: number): number {
        return Math.max(currentMoney * PiggyBankRepository.get(ns).moneyBank.rateToKeep, PiggyBankRepository.get(ns).moneyBank.toReserve);
    }
    static setReserveMoney(ns: NS, amount: number) {
        let bank = PiggyBankRepository.get(ns);
        bank.moneyBank.toReserve = amount;
        PiggyBankRepository.save(ns, bank);
    }
    /** repartition du disponible */
    // TODO
    static readonly weight: Map<MoneyNeeder, number> = new Map([
        [MoneyNeeder.HACKNET, 1], 
        [MoneyNeeder.SERVERS, 1]
    ]);
}

export class Ram {
    static getDisponibleRam(ns: NS, currentRam: number, hostname: string): number {
        return Math.max(
            currentRam - Ram.getReserveRam(ns, currentRam, hostname),
            0
        );
    }
    static getReserveRam(ns: NS, currentRam: number, hostname: string): number {
        return Math.max(
            currentRam * (PiggyBankRepository.get(ns).ramBank.rateToKeep.get(hostname) ?? 0), 
            PiggyBankRepository.get(ns).ramBank.toReserve.get(hostname) ?? 0
        );
    }

}

export function getCurrentRam(ns: NS, hostname: string) {
    return ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname)
}

// TODO : time ?