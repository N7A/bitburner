import { logLevel } from "workspace/common/application-properties"
import * as Log from "workspace/frameworks/logging";
import { LogLevel } from "workspace/common/model/LogLevel";
import { LogLevelLitteral } from "workspace/common/model/LogLevelLitteral";

export class Logger {
    private ns: NS;

    constructor(ns: NS) {
        this.ns = ns;
    }

    log(msg: string, ...args: string[]) {
        this.ns.print(`${Log.time(new Date(Date.now()))} - ${msg}`, ...args);
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
    
}