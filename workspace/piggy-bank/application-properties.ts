export enum MoneyNeeder {
    HACKNET,
    SERVERS
}

export class Money {
    /** pourcentage d'argent à ne pas utiliser */
    private static rateToKeep: number = 30/100;
    /** montant à ne pas utiliser */
    private static toReserve: number = 0 * 1000;

    static getDisponibleMoney(currentMoney: number): number {
        return currentMoney - Money.getReserveMoney(currentMoney);
    }
    static getReserveMoney(currentMoney: number): number {
        return Math.max(currentMoney * Money.rateToKeep, Money.toReserve);
    }
    static setReserveMoney(amount: number) {
        Money.toReserve = amount;
    }
    /** repartition du disponible */
    // TODO
    static readonly weight: Map<MoneyNeeder, number> = new Map([
        [MoneyNeeder.HACKNET, 1], 
        [MoneyNeeder.SERVERS, 1]
    ]);
}

export class Ram {
    /** pourcentage de RAM à ne pas utiliser */
    static readonly rateToKeep: Map<string, number> = new Map([
        ['home', 10/100], 
        ['f1rst', 10/100]
    ]);
    /** quantité de RAM à ne pas utiliser */
    static readonly toReserve: Map<string, number> = new Map([
        ['home', 0], 
        ['f1rst', 0]
    ]);
    
    static getDisponibleRam(currentRam: number, hostname: string): number {
        return Math.max(
            currentRam - Ram.getReserveRam(currentRam, hostname),
            0
        );
    }
    static getReserveRam(currentRam: number, hostname: string): number {
        return Math.max(currentRam * (Ram.rateToKeep.get(hostname) ?? 0), Ram.toReserve.get(hostname) ?? 0);
    }

}

export function getCurrentRam(ns: NS, hostname: string) {
    return ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname)
}

// TODO : time ?