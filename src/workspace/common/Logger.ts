import { logLevel } from "workspace/common/application-properties"

export class Logger {
    debug(ns: NS, message: string) {
        if (logLevel !== LogLevel.DEBUG) {
            return;
        }
            
        const now: Date = new Date(Date.now())
        const hour: number = now.getHours()
        const minute: number = now.getMinutes()
        const second: number = now.getSeconds()
        const timestamp: string = hour + ":" + minute + ":" + second
        ns.print(`${timestamp} - ${message}`)
    }
    
    /*info(msg: string, ...args: string[]) {
        this.ns.tprintf(`${TermLogger.INFO_LITERAL} ${msg}`, ...args);
    }

    warn(msg: string, ...args: string[]) {
        this.ns.tprintf(`${TermLogger.WARN_LITERAL} ${msg}`, ...args);
    }

    err(msg: string, ...args: string[]) {
        this.ns.tprintf(`${TermLogger.ERR_LITERAL} ${msg}`, ...args);
    }

    log(msg: string, ...args: string[]) {
        this.ns.tprintf(`${TermLogger.TRACE_LITERAL} ${msg}`, ...args);
    }*/
}

export enum LogLevel {
    ERROR,
    WARN,
    INFO,
    DEBUG
}