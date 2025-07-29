/** pourcentage d'argent qu'on veux mettre dans les upgrades */
export const moneyRateToSpend: number = 70/100;
/** montant à ne pas utiliserdans les upgrades */
export const moneyReserve: number = 0 * 1000 * 1000;
/** loop frequency time; Default : 1 minute (if frequency too low, only cheapest upgrade will be selected) */
export const defaultInterval: number = 1000 * 60 * 1;
