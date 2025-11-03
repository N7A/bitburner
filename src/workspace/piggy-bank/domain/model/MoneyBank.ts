export type MoneyBank = {
    /** pourcentage d'argent à ne pas utiliser */
    rateToKeep: number;
    /** montant à ne pas utiliser */
    toReserve: number;
    /** Répartition de la RAM en fonction du type d'execution */
    repartitionByType: Map<MoneyNeeder, number> | Object;
}

export enum MoneyNeeder {
    HACKNET,
    SERVERS,
    STOCK_MARKET,
    GANG
}