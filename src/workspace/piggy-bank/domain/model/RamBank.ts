import { ProcessRequestType } from "workspace/load-balancer/domain/model/ProcessRequestType";

export type RamBank = {
    /** pourcentage de RAM à ne pas utiliser */
    rateToKeep: Map<string, number> | Object;
    /** quantité de RAM à ne pas utiliser */
    toReserve: Map<string, number> | Object;
    /** Répartition de la RAM en fonction du type d'execution */
    repartitionByType: Map<ProcessRequestType, number> | Object;
}