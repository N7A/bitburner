import { getPortPrograms } from 'workspace/resource-generator/hacking/model/PortProgram';
import { DarkwebUpgrade } from 'workspace/resource-generator/hacking/unlock/model/DarkwebUpgrade';

/**
 * @requires singularity
 */
export async function selectUpgrade(ns: NS): Promise<DarkwebUpgrade | null> {
    const upgrades: DarkwebUpgrade[] = getAllUpgrades(ns);

    for(const upgrade of upgrades) {
        if(!upgrade.isPurchased()) {
            return upgrade;
        }
    }
    
    return null;
}

// TODO : extract purchase on script run to reduice ram
function getAllUpgrades(ns: NS): DarkwebUpgrade[] {
    return [
        {
            name: 'TOR router', 
            isPurchased: ns.hasTorRouter,
            cost: 200 * 1000, 
            //ns.singularity.purchaseTor
            purchase: '/workspace/resource-generator/hacking/unlock/purchase-tor.worker.ts'
        },
        ...getPortPrograms(ns).map(x => {
            return {
                name: x.filename,
                isPurchased: () => ns.fileExists(x.filename, 'home'), 
                cost: ns.singularity.getDarkwebProgramCost(x.filename),
                purchase: `/workspace/resource-generator/hacking/unlock/purchase-program.worker.ts`
            }
        })
    ]

}