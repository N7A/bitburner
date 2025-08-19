import { LogLevel } from "workspace/common/Logger";
import { logLevel } from "workspace/common/application-properties";

export class TerminalLogger {
    static INFO_LITERAL = "INFO   >";
    static WARN_LITERAL = "WARN   >";
    static ERR_LITERAL = "ERROR  >";
    static TRACE_LITERAL = "TRACE  >";
    static SUCCESS_LITERAL = "SUCCESS  >";
    ns: NS;

    constructor(ns: NS) {
        this.ns = ns;
    }

    success(msg: string, ...args: string[]) {
        this.ns.tprintf(`${TerminalLogger.SUCCESS_LITERAL} ${msg}`, ...args);
    }

    info(msg: string, ...args: string[]) {
        this.ns.tprintf(`${TerminalLogger.INFO_LITERAL} ${msg}`, ...args);
    }

    warn(msg: string, ...args: string[]) {
        this.ns.tprintf(`${TerminalLogger.WARN_LITERAL} ${msg}`, ...args);
    }

    err(msg: string, ...args: string[]) {
        this.ns.tprintf(`${TerminalLogger.ERR_LITERAL} ${msg}`, ...args);
    }

    trace(msg: string, ...args: string[]) {
        if (logLevel !== LogLevel.TRACE) {
            return;
        }

        this.ns.tprintf(`${TerminalLogger.TRACE_LITERAL} ${msg}`, ...args);
    }
}