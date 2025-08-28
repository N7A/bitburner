import * as Log from 'workspace/socle/utils/logging';

/**
 * 
 * @remarks RAM cost : 0 GB
 */
export class Info {
    protected ns: NS;
    protected target: string;

    constructor(ns: NS, target: string) {
        this.ns = ns;
        this.target = target;
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
        
        Log.initTailTitle(this.ns, Log.targetColorLess(this.target), 'info');
        
        this.ns.ui.openTail();
    }
    //#endregion Dashboard
}