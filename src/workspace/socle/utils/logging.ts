export function setTailSize(ns: NS) {
    const messages: string[] = ns.getScriptLogs();
    const maxWidth = Math.floor(ns.ui.windowSize()[0] * 2/3);
    const maxHeight = Math.floor(ns.ui.windowSize()[1] * 2/3);

    const maxRow = messages.length;
    const maxColumn = messages.map(x => x.length).reduce((a, b) => Math.max(a, b));
    ns.ui.resizeTail(Math.min(maxColumn * 9.5, maxWidth), Math.min(maxRow * 25.5, maxHeight));
}

/**
 * Create a Table display of the provided data
 * 
 * @param {string[]} headers Column Headers
 * @param  {...string[]} columns Column data (/!\ ansi color break width calcul)
 * 
 * @remarks Ram cost : 0
 */
export function buildTable(headers: string[], ...columns: string[][]) {
    const maxReducer = (a: number, b: number) => a > b ? a : b;
    // Calculate Column Widths
    let widths: number[] = [];
    columns.forEach((column, i) => {
        widths[i] = column.concat([headers[i]]).map(s => s.length).reduce(maxReducer);
    });

    let output = "\n";

    // Write Headers
    headers.forEach((h, i) => {
        output += ` ${h.padEnd(widths[i], " ")} |`;
    });

    output += "\n";

    // Write Separator
    headers.forEach((h, i) => {
        output += `${"".padEnd(widths[i] + 2, "=")}|`;
    });

    output += "\n";

    let rows = columns[0].length;
    for (let row = 0; row < rows; row++) {
        columns.forEach((c, i) => {
            if (c[row] == "-") {
                output += ` ${"".padEnd(widths[i], "-")} |`;
            } else {
                output += ` ${c[row].padEnd(widths[i], " ")} |`;
            }
        });

        output += "\n";
    }

    return output;
}

const DEFAULT_BLOCK_LOG_WIDTH: number = 40

/**
 * @remarks Ram cost : 0
 */
export function getStartLog(doubleLine: boolean = true, title?: string) {
    const width: number = DEFAULT_BLOCK_LOG_WIDTH
    const line = doubleLine ? '═' : '─'
    const end = doubleLine ? '╗' : '┐'
    return color(/*'╔' + */(`${title ? ' ' + title + ' ' : ''}`).padStart(width/2, line).padEnd(width/2, '═') + end, Color.WHITE)
}

/**
 * @remarks Ram cost : 0
 */
export function getEndLog(doubleLine: boolean = true, title?: string) {
    const width: number = DEFAULT_BLOCK_LOG_WIDTH
    const line = doubleLine ? '═' : '─'
    const end = doubleLine ? '╝' : '┘'
    return color(/*'╚' + */(`${title ? ' ' + title + ' ' : ''}`).padStart(width/2, line).padEnd(width/2, '═') + end, Color.WHITE)
}

const colorReset = "\u001b[0m";

export enum Color {
    RED = "\u001b[31m",
    GREEN = "\u001b[32m",
    YELLOW = "\u001b[33m",
    BLUE = "\u001b[34m",
    MAGENTA = "\u001b[35m",
    CYAN = "\u001b[36m",
    WHITE = "\u001b[37m",
}

export enum BackgrounColor {
    RED = "\u001b[41m",
    GREEN = "\u001b[42m",
    YELLOW = "\u001b[43m",
    BLUE = "\u001b[44m",
    MAGENTA = "\u001b[45m",
    CYAN = "\u001b[46m",
    WHITE = "\u001b[47m",
}

export enum Typography {
    BOLD = "\u001b[1m",
    UNDERLINE = "\u001b[4m"
}

/**
 * @remarks Ram cost : 0
 */
export function color(message: string, color: Color) {
    return `${color}${message}${colorReset}`
}

/**
 * @remarks Ram cost : 0
 */
export function backgroundColor(message: string, color: BackgrounColor) {
    return `${color}${message}${colorReset}`
}


/**
 * @param {NS} ns
 * @param {number} montant
 * 
 * @remarks Ram cost : 0
 */
export function money(ns: NS, montant: number, options: {colorless:boolean} = {colorless: false}): string {
    const message: string = `\$${ns.formatNumber(montant)}`;

    if (options.colorless) {
        return message;
    }

    return color(message, Color.YELLOW);
}

/**
 * @param {NS} ns
 * @param {number} date
 * 
 * @remarks Ram cost : 0
 */
export function date(ns: NS, date: Date): string {
    return date.toLocaleTimeString();
}

enum TimeValue {
    SECONDS_BY_MINUTE = 60,
    MINUTES_BY_HOUR = 60,
    HOURS_BY_DAY = 24
}
export function time(date: Date) {
    const hour: number = date.getHours()
    const minute: number = date.getMinutes()
    const second: number = date.getSeconds()

    return hour.toString().padStart(2, '0') + ":" + minute.toString().padStart(2, '0') + ":" + second.toString().padStart(2, '0')
}

export function duration(date: Date) {    
    var seconds = Math.floor(date.getTime() / 1000);
    let days: number = 0;
    let hours: number = 0;
    let minutes: number = 0;

    var interval = seconds / (TimeValue.HOURS_BY_DAY * TimeValue.MINUTES_BY_HOUR * TimeValue.SECONDS_BY_MINUTE);
    if (interval > 0) {
        days = Math.floor(interval);
        seconds -= days * (TimeValue.HOURS_BY_DAY * TimeValue.MINUTES_BY_HOUR * TimeValue.SECONDS_BY_MINUTE);
    }
    interval = seconds / (TimeValue.MINUTES_BY_HOUR * TimeValue.SECONDS_BY_MINUTE);
    if (interval > 0) {
        hours = Math.floor(interval);
        seconds -= hours * (TimeValue.MINUTES_BY_HOUR * TimeValue.SECONDS_BY_MINUTE);
    }
    interval = seconds / TimeValue.SECONDS_BY_MINUTE;
    if (interval > 0) {
        minutes = Math.floor(interval);
        seconds -= minutes * TimeValue.SECONDS_BY_MINUTE;
    }
    seconds = Math.floor(seconds);

    return (days > 0 ? days + "j " : "") 
        + hours.toString().padStart(2, '0') + "h" + minutes.toString().padStart(2, '0') + "m" + seconds.toString().padStart(2, '0') + "s";
}

/**
 * @param fieldName nom du champ
 * @param value valeur du champ
 * @param unit unité du champ
 * 
 * @remarks Ram cost : 0
 */
export function INFO(fieldName: string, value: any, unit?: string): string {
    return color(`${fieldName} : `, Color.MAGENTA) + `${value}${unit ? ' ' + unit : ''}`;
}

/**
 * @param hostname cible
 * 
 * @remarks Ram cost : 0
 */
export function target(hostname: string, options: {colorless:boolean} = {colorless: false}): string {
    if (options.colorless) {
        return '> ' + hostname + ' <';
    }

    return '> ' + color(hostname, Color.CYAN) + ' <';
}

/**
 * @param hostname source
 * 
 * @remarks Ram cost : 0
 */
export function source(hostname: string, options: {colorless:boolean} = {colorless: false}): string {
    if (options.colorless) {
        return '< ' + hostname + ' >';
    }

    return '< ' + color(hostname, Color.YELLOW) + ' >';
}

/**
 * @param value cible
 * 
 * @remarks Ram cost : 0
 */
export function script(value: string): string {
    return color(value, Color.YELLOW);
}

/**
 * @param value cible
 * 
 * @remarks Ram cost : 0
 */
export function action(value: string): string {
    return color(value, Color.WHITE);
}

/**
 * @param value cible
 * 
 * @remarks Ram cost : 0
 */
export function title(value: string): string {
    return color(value, Color.CYAN);
}

/**
 * @param value cible
 * 
 * @remarks Ram cost : 0
 */
export function threshold(ns: NS, currentValue: number, threshold: number): string {
    const separateur = threshold > currentValue ? ' / ' : ' >>> '
    const difference = Math.abs(threshold - currentValue);

    if (threshold === currentValue) {
        return `SUCCESS Threshold OK (' + ${ns.formatNumber(currentValue)} + ')`
    }

    return ns.formatNumber(currentValue) + separateur + ns.formatNumber(threshold) + ' (' + ns.formatNumber(difference) + ')';
}

export function object(object: any) {
    const keys = Object.keys(object);
    let messages: string[] = [];
    for (const key of keys) {
        messages.push(INFO(key, object[key]));
    }
    return messages.join('\n');
}