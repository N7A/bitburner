export class GitConnector {
    private ns: NS;
    private repository: GitRepository;
    private logger: TermLogger;

    constructor(ns: NS, repository: GitRepository) {
        this.ns = ns;
        this.repository = repository;
        this.logger = new TermLogger(ns);
    }

    /**
     * 
     * @param ns Pull file to home
     * @param file 
     */
    async pullFile(
        file: string,
        sourceDirectoryPath: string = ''
    ) {
        const sourceFile = `${this.repository.baseUrl}${sourceDirectoryPath}${file}`;
        this.ns.tprintf(
            `INFO   > Downloading ${sourceFile} -> ${file}`
        );
        if (this.ns.fileExists(file)) this.ns.rm(file)
    
        if (!(await this.ns.wget(sourceFile, file, "home"))) {
            this.ns.tprintf(`ERROR  > ${sourceFile} -> ${file} failed.`);
            this.ns.exit();
        }
    }
    
    async pullAll() {
        // recupération du fichier manifest
        await this.pullFile(this.repository.manifestFilepath);
        // recupération des fichiers définis dans le manifest
        await this.pullManifestFiles();
    }

    async pullManifestFiles() {
        const files = (this.ns.read(this.repository.manifestFilepath) as string)
            // ligne par ligne
            .split(/\r?\n/)
            // ignore ligne vide
            .filter((x) => x.trim() != "")
            .map(line => {
                return line.startsWith("./")
                ? line.substring(1)
                : line.startsWith("/")
                ? line
                : null
            });

        this.logger.info(`Contents of manifest:`);
        this.logger.info(`\t${files}`);

        for (let file of files) {
            if (!file) {
                this.logger.err(`Could not read line ${file}`);
            } else {
                await this.pullFile(file, this.repository.sourceDirectoryPath);
            }
        }
    }
}

export type GitRepository = {
    baseUrl: string,
    manifestFilepath: string,
    sourceDirectoryPath: string
}

class TermLogger {
    static INFO_LITERAL = "INFO   >";
    static WARN_LITERAL = "WARN   >";
    static ERR_LITERAL = "ERROR  >";
    static TRACE_LITERAL = "TRACE  >";
    ns: NS;

    constructor(ns: NS) {
        this.ns = ns;
    }

    info(msg: string, ...args: string[]) {
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
    }
}
