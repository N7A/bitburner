export type DarkwebUpgrade = {
    name: string,
    isPurchased: () => boolean, 
    cost: number, 
    // chemin vers le script d'achat (script externe pour ne pas rajouter le cout de RAM ponctuel au scheduler)
    purchase: string
}