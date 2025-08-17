import { logLevel } from "workspace/common/application-properties"
import * as Log from "workspace/frameworks/logging";

export class Logger {
    private ns: NS;

    constructor(ns: NS) {
        this.ns = ns;
    }

    debug(message: string) {
        if (logLevel !== LogLevel.DEBUG) {
            return;
        }
        
        this.ns.print(`${Log.time(new Date(Date.now()))} - ${message}`)
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