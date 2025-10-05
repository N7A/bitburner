import { logLevel } from "workspace/common/log.properties"
import * as Log from "workspace/socle/utils/logging";
import { LogLevel } from "workspace/socle/model/LogLevel";
import { LogLevelLitteral } from "workspace/socle/model/LogLevelLitteral";
import { Color } from "workspace/socle/utils/logging";

export class Logger {
    private ns: NS;
    private history: string[] = [];
    private isWaiting: boolean = false;
    private loadingBar: {numberDone: number, numberTotal: number};

    constructor(ns: NS) {
        this.ns = ns;
    }

    log(message: string, ...args: string[]) {
        const formatedMessage: string = `${LogLevelLitteral.NEUTRAL} ${message.concat(...args)}`;

        this.print(formatedMessage, LogLevel.INFO);
    }

    stopWaiting() {
        this.isWaiting = false;
    }

    async waiting(subject: string) {
        this.isWaiting = true;

        const startTime = new Date(Date.now());

        let dotsTime = 0;
        do {
            this.ns.clearLog();
            this.history.forEach(element => {
                this.ns.print(element);
            });

            const message = `Waiting ${subject}${Log.color('.'.repeat(dotsTime).padEnd(3), Color.MAGENTA)}`;
            this.ns.print(message);
            dotsTime ++
            if (dotsTime > 3) {
                dotsTime = 0;
            }
            await this.ns.asleep(1000);
        } while(this.isWaiting);
        this.history.push(`${Log.time(startTime)} - Waiting ${subject}${'.'.repeat(3)}`);

        this.ns.clearLog();
        this.history.forEach(element => {
            this.ns.print(element);
        });
    }

    refreshLoadingBar(numberDone: number, numberTotal: number) {
        this.ns.clearLog();
        this.history.forEach(element => {
            this.ns.print(element);
        });

        const barSize: number = 40
        const pourcentage: number = Math.floor(numberDone / numberTotal * barSize);
        let color = Color.CYAN;
        if (pourcentage === barSize) {
            color = Color.GREEN;
            this.loadingBar = null;
        } else {
            this.loadingBar = {numberDone: numberDone, numberTotal: numberTotal};
        }

        const pourcent: string = `${Math.floor(numberDone / numberTotal * 100).toString().padStart(3)}% `;
        const count: string = `${numberDone.toString().padStart(numberTotal.toString().length)} / ${numberTotal}`;
        this.ns.print(count.padStart(Math.ceil((barSize - count.length) / 2) + pourcent.length));
        
        const message = pourcent
            + '['
            + (`${Log.color(`${'='.repeat(pourcentage)}${pourcentage === barSize ? '' : '>'}`, color)}`).padEnd(barSize)
            + ']';
        
        this.ns.print(message);
    }

    err(message: string, ...args: string[]) {
        const formatedMessage: string = `${LogLevelLitteral.ERROR} ${message.concat(...args)}`;

        this.print(formatedMessage, LogLevel.ERROR);
    }

    warn(message: string, ...args: string[]) {
        const formatedMessage: string = `${LogLevelLitteral.WARN} ${message.concat(...args)}`;

        this.print(formatedMessage, LogLevel.WARN);
    }

    info(message: string, ...args: string[]) {
        const formatedMessage: string = `${LogLevelLitteral.INFO} ${message}`.concat(...args)

        this.print(formatedMessage, LogLevel.INFO);
    }

    debug(message: string) {
        const formatedMessage: string = `${LogLevelLitteral.DEBUG} ${message}`;

        this.print(formatedMessage, LogLevel.DEBUG);
    }

    trace(message: string) {
        const formatedMessage: string = `${LogLevelLitteral.TRACE} ${message}`;

        this.print(formatedMessage, LogLevel.TRACE);
    }
    
    success(message: string, logLevel?: LogLevel) {
        const formatedMessage: string = `${LogLevelLitteral.SUCCESS} ${message}`;
        
        this.print(formatedMessage, logLevel ?? LogLevel.INFO);
    }
    
    // TODO: get currentLogLevel from home server
    private print(message: string, currentLogLevel: LogLevel) {
        if (currentLogLevel <= logLevel.terminal) {
            this.printTerminal(`${Log.time(new Date(Date.now()))} - ${message}`);
        }

        if (currentLogLevel <= logLevel.print) {
            const formatedMessage = `${Log.time(new Date(Date.now()))} - ${message}`
            this.history.push(formatedMessage);

            if (this.loadingBar) {
                this.refreshLoadingBar(this.loadingBar.numberDone, this.loadingBar.numberTotal);
                return;
            }
            this.printDashboard(formatedMessage);
        }
    }

    private printDashboard(message: string) {
        this.ns.print(`${message}`);
    }
    
    private printTerminal(message: string) {
        this.ns.tprintf(`${message}`);
    }
}