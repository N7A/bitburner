import { AugmentationSelector } from "workspace/resource-generator/faction/model/augmentation-selector";

/**
 * @requires singularity
 */
export class FactionSelector {
    getWantedFactions(ns: NS) {
        return ns.singularity.checkFactionInvitations()
            // faction have not owned augmentation
            .filter(faction => ns.singularity.getAugmentationsFromFaction(faction)
                .some(x => new AugmentationSelector().getWantedAugmentations(ns).includes(x)));
    }
}