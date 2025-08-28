import { logLevel } from "workspace/common/application-properties"
import * as Log from "workspace/socle/utils/logging";
import { LogLevel } from "workspace/socle/model/LogLevel";
import { LogLevelLitteral } from "workspace/socle/model/LogLevelLitteral";
import { Color } from "workspace/socle/utils/logging";

export class Logger {
    private ns: NS;
    private history: string[] = [];
    private isWaiting: boolean = false;

    constructor(ns: NS) {
        this.ns = ns;
    }

    log(msg: string, ...args: string[]) {
        const message = `${Log.time(new Date(Date.now()))} - ${msg}`;
        this.history.push(message.concat(...args));
        this.ns.print(message, ...args);
    }

    stopWaiting() {
        this.isWaiting = false;
    }

    async waiting(subject: string) {
        this.isWaiting = true;

        this.history.push(`${Log.time(new Date(Date.now()))} - Waiting ${subject}${'.'.repeat(3)}`)

        let dotsTime = 0;
        do {
            this.ns.clearLog();
            this.history.slice(0, this.history.length-1).forEach(element => {
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

        this.ns.clearLog();
        this.history.forEach(element => {
            this.ns.print(element);
        });
    }

    refreshLoadingBar(numberDone: number, nuberTotal: number) {
        this.ns.clearLog();
        this.history.forEach(element => {
            this.ns.print(element);
        });

        const barSize: number = 98
        const pourcentage: number = Math.floor(numberDone / nuberTotal * barSize);
        let color = Color.MAGENTA;
        if (pourcentage === barSize) {
            color = Color.GREEN;
        }
        const message = `${Math.floor(numberDone / nuberTotal * 100).toString().padStart(3)}% ` 
            + '['
            + `${Log.color(`${'='.repeat(pourcentage)}${pourcentage === barSize ? '' : '>'}`, color)}`.padEnd(barSize) 
            + ']';
        this.ns.print(message);
    }

    err(msg: string, ...args: string[]) {
        this.ns.print(`${Log.time(new Date(Date.now()))} - ${LogLevelLitteral.ERROR} ${msg}`, ...args);
    }

    warn(msg: string, ...args: string[]) {
        this.ns.print(`${Log.time(new Date(Date.now()))} - ${LogLevelLitteral.WARN} ${msg}`, ...args);
    }

    info(msg: string, ...args: string[]) {
        this.ns.print(`${Log.time(new Date(Date.now()))} - ${LogLevelLitteral.INFO} ${msg}`, ...args);
    }

    debug(message: string) {
        if (logLevel !== LogLevel.DEBUG) {
            return;
        }
        
        this.ns.print(`${Log.time(new Date(Date.now()))} - ${LogLevelLitteral.DEBUG} ${message}`);
    }

    trace(message: string) {        
        this.ns.print(`${Log.time(new Date(Date.now()))} - ${LogLevelLitteral.TRACE} ${message}`);
    }
    
    success(message: string) {        
        this.ns.print(`${Log.time(new Date(Date.now()))} - ${LogLevelLitteral.SUCCESS} ${message}`);
    }
    
}