/**
 * Active les scripts quand le jeu atteind l'état voulu.
 */
class OrchestrationLauncher {
    private ns: NS;

    constructor(ns: NS) {
        this.ns = ns;
    }

    run() {
        // TODO: run thread waiting with multi PID
        this.codingContractsOrchestration();
        this.ipvgoOrchestration();
        this.stockMarketOrchestration();
    }

    setupHackOrchestration() {
        // TODO: run thread waiting serveur money en dessous d'un palier
        // TODO: OU money ne fait que descendre (grow pas assez puissant)
        // TODO: add setup serveur to executions
    }

    codingContractsOrchestration() {
        // TODO: run thread waiting enough RAM
        // TODO: add CMD_DIRECTORY + 'resource-generator/coding-contract/resolve-contracts.scheduler.ts' to executions
    }

    ipvgoOrchestration() {
        const script: string = 'workspace/bitburner/src/workspace/orchestration/ipvgo-orchestration.daemon.ts';
        this.ns.run(script);
    }

    lootBackupBonusOrchestration() {
    }

    stockMarketOrchestration() {
        // TODO: run thread waiting enough RAM to run cmd/resource-generator/stock-market/buy-stock.scheduler.ts
        // TODO: add CMD_DIRECTORY + 'resource-generator/stock-market/wse-upgrade.scheduler.ts' to executions
        
        // TODO: run thread waiting wse enabled
        // TODO: add CMD_DIRECTORY + 'resource-generator/stock-market/buy-stock.scheduler.ts' to executions
    }
}