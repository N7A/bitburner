export class FileHandler {
    #file;
    #ns;

    constructor (ns: NS, file: string) {
        this.#ns = ns;
        this.#file = file;
    }

    async newFile() {
        this.#ns.write(this.#file, "", "w");
    }

    async write(data: string, mode:"w" | "a" | undefined ="a") {
        this.#ns.write(this.#file, JSON.stringify(data), mode);
    }

    async read() {
        let dataString = this.#ns.read(this.#file);
        if (dataString.length > 1) {
            return JSON.parse(dataString);
        } else {
            return [];
        }
    }
}