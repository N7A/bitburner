import { DarkwebUpgrade } from 'workspace/resource-generator/hacking/unlock/model/DarkwebUpgrade';
import { GameRepository } from "workspace/game/domain/game.repository";

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
    const repository: GameRepository = new GameRepository(ns);
    
    return [
        {
            name: 'TOR router', 
            isPurchased: ns.hasTorRouter,
            cost: 200 * 1000, 
            purchase: '/workspace/resource-generator/hacking/unlock/purchase-tor.worker.ts'
        },
        {
            name: 'Formulas.exe',
            isPurchased: () => repository.getData().hasFormulas, 
            cost: ns.singularity.getDarkwebProgramCost('Formulas.exe'),
            purchase: `/workspace/resource-generator/hacking/unlock/purchase-program.worker.ts`
        }
    ]

}