import * as Log from 'workspace/frameworks/logging';

export class Info<T> {
    protected ns: NS;
    protected target: string;
    protected data: T;

    constructor(ns: NS, target: string, data: T) {
        this.ns = ns;
        this.target = target;
        this.data = data;
    }

    run() {
        this.setupDashboard();
    
        this.ns.print(Log.getStartLog());
    
        this.printData();
    
        this.ns.print(Log.getEndLog());
    }
    
    //#region Dashboard
    setupDashboard() {
        this.ns.disableLog("ALL");
        this.ns.clearLog();
        
        Log.initTailTitle(this.ns, Log.targetColorLess(this.target), 'info');
        
        this.ns.ui.openTail();
    }
    //#endregion Dashboard
    
    printData() {}
}