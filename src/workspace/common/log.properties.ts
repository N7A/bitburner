import { LogLevel } from "workspace/socle/model/LogLevel";

export const logLevel: LogLevel = LogLevel.DEBUG

export const logDestination = new Map<LogLevel, 'terminal' | 'alert' | 'print'>([
    [LogLevel.ERROR, 'terminal'],
    [LogLevel.INFO, 'terminal']
]);