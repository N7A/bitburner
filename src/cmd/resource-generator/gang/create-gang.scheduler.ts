export async function main(ns: NS) {
    if (!ns.gang.inGang()) {
        for (const faction of Object.values(ns.getPlayer().factions)) {
            if (ns.gang.createGang(faction)) {
                break;
            }
        }
    }
}