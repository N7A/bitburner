export type RamBank = {
    /** pourcentage de RAM à ne pas utiliser */
    rateToKeep: Map<string, number>;
    /** quantité de RAM à ne pas utiliser */
    toReserve: Map<string, number>;
}