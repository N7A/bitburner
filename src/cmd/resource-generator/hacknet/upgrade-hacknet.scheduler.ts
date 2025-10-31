import { executeUpgrade } from 'workspace/resource-generator/hacknet/upgrade-hacknet.worker'
import { getBestProfits, getBestTarget } from 'workspace/resource-generator/hacknet/upgrade-hacknet.target-selector'
import * as Log from 'workspace/socle/utils/logging';
import { UpgradeExecution } from 'workspace/resource-generator/hacknet/model/UpgradeExecution'
import { MoneyPiggyBankService } from 'workspace/piggy-bank/money-piggy-bank.service';
import { Dashboard } from 'workspace/socle/interface/dashboard';
import { DaemonFlags } from 'workspace/common/model/DaemonFlags';
import { Headhunter } from 'workspace/socle/interface/headhunter';
import { Logger } from 'workspace/socle/Logger';

//#region Constantes
const FLAGS_SCHEMA: [string, string | number | boolean | string[]][] = [
    [DaemonFlags.oneshot, false]
];
//#endregion Constantes

/**
 * Runner qui gère l'achat des nodes Hacknet.
 * 
 * @param argument1 loop frequency time
 * 
 * @remarks Running RAM cost : 6,35GB
*/
export async function main(ns: NS) {
    // load input flags
    const scriptFlags = ns.flags(FLAGS_SCHEMA);

    const upgradeHeadHunter: UpgradeHacknetHeadHunter = new UpgradeHacknetHeadHunter(ns);

    if (scriptFlags[DaemonFlags.oneshot]) {
        upgradeHeadHunter.killAfterLoop();
    }
    
    await upgradeHeadHunter.run();
    
    ns.ui.closeTail();
}

class UpgradeHacknetHeadHunter extends Headhunter<UpgradeExecution> {
    private dashboard: Dashboard;
    private moneyPiggyBankService: MoneyPiggyBankService;

    constructor(ns: NS) {
        super(ns, false)
        this.logger = new Logger(ns);
        this.dashboard = new Dashboard(ns, 'Hacknet', {icon: '🕸️', role: 'manager'});//🌐
        this.setupDashboard();
        
        this.moneyPiggyBankService = new MoneyPiggyBankService(ns);
    }
    
    protected async work(targets: UpgradeExecution[]): Promise<any> {
        for (const target of targets) {
            // wait purchase to be possible
            if (this.moneyPiggyBankService.getDisponibleMoney(this.getMoney()) < target.cost) {
                this.refreshDashBoard2(this.getMoney(), this.REFRESH_INTERVAL, target);
                continue;
            }

            // get best purchase with max amount disponible
            const selectedUpgrade = getBestProfits(this.ns, this.moneyPiggyBankService.getDisponibleMoney(this.getMoney()));

            // do purchase
            executeUpgrade(this.ns, selectedUpgrade);

            // wait purchase to be possible
            // TODO: prendre en compte que le repaytime peut reduire avec la prochaine augmentation
            /*while(this.getAutoRepayTime() > 1000 * 60 * 60 * 5) {
                refreshDashBoard2(this.getMoney(), this.REFRESH_INTERVAL, target);
                // sleep to prevent crash because of infinite loop
                await this.ns.sleep(500);
            }*/
        }
    }

    async getTargets(): Promise<UpgradeExecution[]> {
        const nextUpgrade: UpgradeExecution | undefined = getBestTarget(this.ns);
        return nextUpgrade ? [nextUpgrade] : []
    }

    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
        
        const dashboard = new Dashboard(this.ns, 'Hacknet', {icon: '🕸️', role: 'manager'});//🌐
        this.dashboard.initTailTitle();
        this.ns.ui.openTail();
        
        this.ns.ui.moveTail(1000, 50);
        
        this.logger.log('Starting...');
    }

    //#region Utils
	getMoney = () => this.ns.getPlayer().money;
    //#endregion

    refreshDashBoard(threadStartTime: Date, workStartTime: Date, workEndTime: Date) {}

    refreshDashBoard2(currentMoney: number, interval: number | null, nextUpgrade?: UpgradeExecution | undefined) {
        this.ns.clearLog();
        const allNodes: NodeStats[] = Array(this.ns.hacknet.numNodes()).fill(0)
            .map((value, index) => this.ns.hacknet.getNodeStats(index));
        const nodesToShow: NodeStats[] = allNodes
            .filter(x => x.cores < 16 || x.level < 200 || x.ram < 64);
        
        this.ns.print(`Nodes: ${this.ns.hacknet.numNodes()}`);

        if (nodesToShow.length > 0) {
            this.ns.print(Log.buildTable(
                    ["Node", "Produced", "Uptime", "Production", "Level", "RAM", "Cores"],
                    nodesToShow.map((v, i) => `${i}`),
                    nodesToShow.map((v, i) => `${Log.money(this.ns, v.totalProduction, {colorless: true})}`),
                    nodesToShow.map((v, i) => `${new Date(v.timeOnline * 1000).toLocaleTimeString()}`),
                    nodesToShow.map((v, i) => `${Log.money(this.ns, v.production, {colorless: true})} /s`),
                    //nodes.map((v, i) => `${ns.formatRam(v.ramUsed ?? 0)}`),
                    nodesToShow.map((v, i) => `${v.level}`),
                    nodesToShow.map((v, i) => `${v.ram}`),
                    nodesToShow.map((v, i) => `${v.cores}`),
                ));
        }
        
        if (interval !== null) {
            this.ns.print('\n');
            this.ns.print('Next refresh on ', Log.date(this.ns,new Date(new Date().getTime() + interval * 1000)));
        }

        const currentGain = this.ns.getMoneySources().sinceInstall.hacknet + this.ns.getMoneySources().sinceInstall.hacknet_expenses;
        if (currentGain < 0) {
            this.ns.print(Log.INFO(`Auto-repay time`, `${Log.duration(new Date(this.getAutoRepayTime()))}`));
        }
        if (nextUpgrade) {
            this.ns.print(Log.INFO('Next upgrade type', nextUpgrade.upgradeType));
            this.ns.print(Log.INFO('Next upgrade ratio', this.ns.formatNumber(nextUpgrade.ratio)));
            this.ns.print(Log.INFO('Next upgrade cost', Log.money(this.ns, nextUpgrade.cost)));
        }
        this.ns.print(Log.INFO(`Current money`, `${Log.money(this.ns, currentMoney)}`));
        this.ns.print(Log.INFO(`Available`, `${Log.money(this.ns, new MoneyPiggyBankService(this.ns).getDisponibleMoney(currentMoney))}`));
        this.ns.ui.resizeTail(650, Math.min(nodesToShow.length * 25 + 300, 600))
    }

    getAutoRepayTime() {
        const currentGain = this.ns.getMoneySources().sinceInstall.hacknet + this.ns.getMoneySources().sinceInstall.hacknet_expenses;
        const totalProduction: number = Array(this.ns.hacknet.numNodes()).fill(0)
            .map((value, index) => this.ns.hacknet.getNodeStats(index).production)
            .reduce((a,b) => a + b);
        return -currentGain/totalProduction * 1000
    }
}