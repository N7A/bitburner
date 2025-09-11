import * as Log from 'workspace/socle/utils/logging';

export class Alert {
    protected ns: NS;

    constructor(ns: NS) {
        this.ns = ns;
    }

    async run() {
        const startTime: Date = new Date();

        while(!this.waitingEvent()) {
            this.refreshDashboard();
            await this.ns.sleep(500);
        }

        const endTime: Date = new Date();
        
        const duration = new Date(endTime.getTime() - startTime.getTime())

        this.ns.alert(
            this.getAlertMessage()
            + '\n\nAtteint en ' + Log.duration(duration) + '\n'
            + '(Demandé à ' + Log.date(this.ns, startTime) + ')'
        );
    }

    refreshDashboard(): void {}

    waitingEvent(): boolean {
        return true;
    }

    getAlertMessage(): string {
        return 'Not implemented';
    }
}