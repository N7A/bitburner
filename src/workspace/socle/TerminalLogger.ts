import { LogLevel } from "workspace/socle/model/LogLevel";
import { logLevel } from "/workspace/common/log.properties";
import { LogLevelLitteral } from "workspace/socle/model/LogLevelLitteral";

export class TerminalLogger {
    private ns: NS;

    constructor(ns: NS) {
        this.ns = ns;
    }

    success(msg: string, ...args: string[]) {
        this.ns.tprintf(`${LogLevelLitteral.SUCCESS} ${msg}`, ...args);
    }

    info(msg: string, ...args: string[]) {
        this.ns.tprintf(`${LogLevelLitteral.INFO} ${msg}`, ...args);
    }

    warn(msg: string, ...args: string[]) {
        this.ns.tprintf(`${LogLevelLitteral.WARN} ${msg}`, ...args);
    }

    err(msg: string, ...args: string[]) {
        this.ns.tprintf(`${LogLevelLitteral.ERROR} ${msg}`, ...args);
    }

    trace(msg: string, ...args: string[]) {
        if (logLevel !== LogLevel.TRACE) {
            return;
        }

        this.ns.tprintf(`${LogLevelLitteral.TRACE} ${msg}`, ...args);
    }
}