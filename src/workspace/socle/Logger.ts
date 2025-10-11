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
        this.print(message.concat(...args), LogLevelLitteral.NEUTRAL, LogLevel.INFO);
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
            //+ (`${Log.color(`${'='.repeat(pourcentage)}${pourcentage === barSize ? '' : '>'}`, color)}`).padEnd(barSize)
            + (`${Log.color(`${'█'.repeat(pourcentage)}`, color)}`).padEnd(barSize, '░')
            + ']';
        
        this.ns.print(message);
    }

    err(message: string, ...args: string[]) {
        this.print(message.concat(...args), LogLevelLitteral.ERROR, LogLevel.ERROR);
    }

    warn(message: string, ...args: string[]) {
        this.print(message.concat(...args), LogLevelLitteral.WARN, LogLevel.WARN);
    }

    info(message: string, ...args: string[]) {
        this.print(message.concat(...args), LogLevelLitteral.INFO, LogLevel.INFO);
    }

    debug(message: string) {
        this.print(message, LogLevelLitteral.DEBUG, LogLevel.DEBUG);
    }

    trace(message: string) {
        this.print(message, LogLevelLitteral.TRACE, LogLevel.TRACE);
    }
    
    success(message: string, logLevel?: LogLevel) {
        this.print(message, LogLevelLitteral.SUCCESS, logLevel ?? LogLevel.INFO);
    }

    private getSuffixe(logLevel: LogLevelLitteral): string {
        return `${(logLevel ? logLevel : '').padEnd(8, ' ')}> `
            + `${Log.color('[', Color.YELLOW)}${Log.color(Log.time(new Date(Date.now())), Color.WHITE)}${Log.color(']', Color.YELLOW)}`
    }
    
    // TODO: get currentLogLevel from home server
    private print(message: string, logLevelLitteral: LogLevelLitteral, currentLogLevel: LogLevel) {
        if (currentLogLevel <= logLevel.terminal) {
            this.printTerminal(`${this.getSuffixe(logLevelLitteral)} ${message}`);
        }

        if (currentLogLevel <= logLevel.print) {
            const formatedMessage = `${this.getSuffixe(logLevelLitteral)} ${message}`
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