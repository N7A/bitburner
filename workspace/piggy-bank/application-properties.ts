export enum MoneyNeeder {
    HACKNET,
    SERVERS
}

export class Money {
    /** pourcentage d'argent à ne pas utiliser */
    private static rateToKeep: number = 30/100;
    /** montant à ne pas utiliser */
    private static toReserve: number = 7 * 1000 * 1000 * 1000;

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
    static readonly rateToKeep: number = 70/100;
    /** quantité de RAM à ne pas utiliser */
    static readonly toReserve: Map<string, number> = new Map([
        ['home', 4096], 
        ['f1rst', 2048]
    ]);
}

// TODO : time ?