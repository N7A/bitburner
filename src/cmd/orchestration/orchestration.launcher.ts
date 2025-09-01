import { CMD_DIRECTORY } from "workspace/referentiel";

/**
 * Active les scripts quand le jeu atteind l'état voulu.
 */
class OrchestrationLauncher {
    run() {
        // TODO: run thread waiting
        this.codingContractsOrchestration();
        this.ipvgoOrchestration();
        this.stockMarketOrchestration();
    }

    setupOrchestration() {
        // TODO: run thread waiting serveur money en dessous d'un palier
        // TODO: OU money ne fait que descendre (grow pas assez puissant)
        // TODO: add setup serveur to executions
    }

    codingContractsOrchestration() {
        // TODO: run thread waiting enough RAM
        // TODO: add CMD_DIRECTORY + 'resource-generator/coding-contract/resolve-contracts.scheduler.ts' to executions
    }

    ipvgoOrchestration() {
        // TODO: run thread waiting enough RAM
        // TODO: add CMD_DIRECTORY + 'resource-generator/hacknet/ipvgo/play-board.ts' to executions
    }

    stockMarketOrchestration() {
        // TODO: run thread waiting enough RAM to run cmd/resource-generator/stock-market/buy-stock.scheduler.ts
        // TODO: add CMD_DIRECTORY + 'resource-generator/stock-market/wse-upgrade.scheduler.ts' to executions
        
        // TODO: run thread waiting wse enabled
        // TODO: add CMD_DIRECTORY + 'resource-generator/stock-market/buy-stock.scheduler.ts' to executions
    }
}