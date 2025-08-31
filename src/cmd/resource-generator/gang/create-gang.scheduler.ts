import { GANG_LOGO } from 'workspace/resource-generator/gang/application-properties';

export async function main(ns: NS) {
    if (!ns.gang.inGang()) {
        for (const faction of Object.values(ns.getPlayer().factions)) {
            if (ns.gang.createGang(faction)) {
                ns.tprint(`✨ 🥊 Gang ${GANG_LOGO} créé ! ✨`)
                break;
            }
        }
    }
}