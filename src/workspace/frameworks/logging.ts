export function initTailTitle(ns: NS, service: string, role?: string, hostSource?: string, pid?: number) {
    const roleLabel = role ? ` #${role.toLowerCase()}` : ''
    const sourceLabel = hostSource ? `<${hostSource}> ` : ''
    
    ns.ui.setTailTitle(`${sourceLabel}[${service}]${roleLabel}`, pid);
}

/**
 * Create a Table display of the provided data
 * 
 * @param {string[]} headers Column Headers
 * @param  {...string[]} columns Column data
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
export function getStartLog() {
    const width: number = DEFAULT_BLOCK_LOG_WIDTH
    return color(/*'╔' + */'═'.repeat(width-2) + '╗', Color.WHITE)
}

/**
 * @remarks Ram cost : 0
 */
export function getEndLog() {
    const width: number = DEFAULT_BLOCK_LOG_WIDTH
    return color(/*'╚' + */'═'.repeat(width-2) + '╝', Color.WHITE)
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

/**
 * @remarks Ram cost : 0
 */
export function color(message: string, color: Color) {
    return `${color}${message}${colorReset}`
}

/**
 * @param {NS} ns
 * @param {number} montant
 * 
 * @remarks Ram cost : 0
 */
export function money(ns: NS, montant: number): string {
    return '$' + ns.formatNumber(montant);
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

export function time(date: Date) {
    const hour: number = date.getHours()
    const minute: number = date.getMinutes()
    const second: number = date.getSeconds()
    return hour + ":" + minute + ":" + second
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
export function target(hostname: string): string {
    return '> ' + color(hostname, Color.CYAN) + ' <';
}

/**
 * @param hostname cible
 * 
 * @remarks Ram cost : 0
 */
export function targetColorLess(hostname: string): string {
    return '> ' + hostname + ' <';
}

/**
 * @param hostname source
 * 
 * @remarks Ram cost : 0
 */
export function source(hostname: string): string {
    return '<' + color(hostname, Color.YELLOW) + '>';
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