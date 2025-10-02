export type WseUpgrade = {
    name: string,
    isPurchased: () => boolean, 
    cost: number, 
    // extract purchase on script run to reduice ram
    purchase: string
}