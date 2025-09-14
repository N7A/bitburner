import { GameRepository } from "workspace/game/domain/game.repository";
import { Game } from 'workspace/game/domain/model/Game';

export async function main(ns: NS) {
    const repository: GameRepository = new GameRepository(ns);
    
    let data: Game = {
        hasFormulas: this.ns.fileExists('Formulas.exe', 'home'),
        hasSingularity: this.ns.getResetInfo().ownedSF.has(4) || this.ns.getResetInfo().currentNode === 4
    }

    repository.save(data);
}