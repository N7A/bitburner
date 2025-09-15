import { AugmentationSelector } from "./augmentation.selector";

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

    getFactions(ns: NS) {
        return Array.from(new Set(Object.values(ns.enums.FactionName)))
            .map(x => ns.singularity.getFactionInviteRequirements(x))
            .filter(x => x[0].type === "money")
            .map(x => (x[0] as MoneyRequirement))
            .sort((a, b) => a.money - b.money);
    }

    getJoinedFaction(ns: NS) {
        return ns.getPlayer().factions;
    }
}