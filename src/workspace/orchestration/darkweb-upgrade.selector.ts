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

function getAllUpgrades(ns: NS): DarkwebUpgrade[] {
    return [
        {
            name: 'TOR router', 
            isPurchased: ns.hasTorRouter,
            cost: 200 * 1000, 
            purchase: '/workspace/resource-generator/hacking/unlock/purchase-tor.worker.ts'
        },
        {
            name: 'Formulas.exe',
            isPurchased: () => ns.fileExists('Formulas.exe', 'home'), 
            cost: ns.singularity.getDarkwebProgramCost('Formulas.exe'),
            purchase: `/workspace/resource-generator/hacking/unlock/purchase-program.worker.ts`
        }
    ]

}