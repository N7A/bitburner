export type MoneyBank = {
    /** pourcentage d'argent à ne pas utiliser */
    rateToKeep: number;
    /** montant à ne pas utiliser */
    toReserve: number;
}

/** repartition du disponible */
// TODO
/*
export enum MoneyNeeder {
    HACKNET,
    SERVERS
}

static readonly weight: Map<MoneyNeeder, number> = new Map([
    [MoneyNeeder.HACKNET, 1], 
    [MoneyNeeder.SERVERS, 1]
]);*/