/** pourcentage de RAM à ne pas utiliser */
export const ramRateToKeep: number = 70/100;
/** quantité de RAM à ne pas utiliser */
export const ramReserve: Map<string, number> = new Map([
    ['home', 4096], 
    ['f1rst', 2048]
]);
/** temps maximum pour une execution */
export const timeExecutionMax: number = 60 * 60 * 1000;
