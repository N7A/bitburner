/**
 * @requires singularity
 */
export class AugmentationSelector {
    
    getAllAugmentations(ns: NS) {
        return Array.from(new Set(Object.values(ns.enums.FactionName)
            .flatMap(x => ns.singularity.getAugmentationsFromFaction(x))));
    }

    getWantedAugmentations(ns: NS) {
        return this.getAllAugmentations(ns)
            .filter(x => !ns.singularity.getOwnedAugmentations(true).includes(x));
    }

    getBestAugmentations(ns: NS) {
        return this.getWantedAugmentations(ns)
            .map(x => ns.singularity.getAugmentationStats(x))
    }
}