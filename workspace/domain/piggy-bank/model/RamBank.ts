export type RamBank = {
    /** pourcentage de RAM à ne pas utiliser */
    rateToKeep: Map<string, number> | Object;
    /** quantité de RAM à ne pas utiliser */
    toReserve: Map<string, number> | Object;
}