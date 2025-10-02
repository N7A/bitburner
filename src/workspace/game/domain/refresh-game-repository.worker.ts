import { GameRepository } from "workspace/game/domain/game.repository";
import { Game } from 'workspace/game/domain/model/Game';

export async function main(ns: NS) {
    const repository: GameRepository = new GameRepository(ns);
    
    let data: Game = {
        hasFormulas: ns.fileExists('Formulas.exe', 'home'),
        hasSingularity: ns.getResetInfo().ownedSF.has(4) || ns.getResetInfo().currentNode === 4,
        hasWSEAccount: ns.stock.hasWSEAccount(),
        hasTIXAPIAccess: ns.stock.hasTIXAPIAccess(),
        has4SDataTIXAPI: ns.stock.has4SDataTIXAPI()
    }

    repository.save(data);
}