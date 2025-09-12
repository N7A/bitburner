import * as Log from 'workspace/socle/utils/logging';
import { Dashboard } from 'workspace/socle/interface/dashboard';

/**
 * 
 * @remarks RAM cost : 0 GB
 */
export class Info {
    protected ns: NS;
    protected target: string;
    private dashboard: Dashboard;

    constructor(ns: NS, target: string) {
        this.ns = ns;
        this.target = target;
        this.dashboard = new Dashboard(ns, Log.target(this.target, {colorless: true}), {icon: 'ℹ️', role: 'info'});
    }

    /**
     * 
     * @remarks RAM cost : 0 GB
     */
    run() {
        this.setupDashboard();
    
        this.ns.print(Log.getStartLog());
    
        this.printData();

        this.ns.print(Log.getEndLog());

        Log.setTailSize(this.ns);
    }
    
    /**
     * Définition des données à afficher en log.
     * 
     * @remarks RAM cost : 0 GB
     */
    printData() {}

    //#region Dashboard
    /**
     * 
     * @remarks RAM cost : 0 GB
     */
    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
        
        this.dashboard.initTailTitle();

        this.ns.ui.openTail();
    }
    //#endregion Dashboard
}