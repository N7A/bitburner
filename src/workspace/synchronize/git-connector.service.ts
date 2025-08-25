import { GitRepository } from "workspace/synchronize/model/GitRepository";
import { TerminalLogger } from "workspace/common/TerminalLogger";
import { getFilepaths } from "workspace/frameworks/file";

//#region Constants
const MAIN_SERVER = 'home';
//#endregion Constants

/**
 * Service de connection à un repository GitHub.
 */
export class GitHubConnector {
    private ns: NS;
    private repository: GitRepository;
    private logger: TerminalLogger;

    /**
     * Service de connection à un repository GitHub.
     * @param ns Bitburner API
     * @param repository repository to connect
     */
    constructor(ns: NS, repository: GitRepository) {
        this.ns = ns;
        this.repository = repository;
        this.logger = new TerminalLogger(ns);
    }

    async pullAll() {
        // recupération du fichier manifest
        await this.pullFile(this.repository.manifestFilepath);
        // recupération des fichiers définis dans le manifest
        await this.pullManifestFiles();
        // suppression des fichiers non définis dans le manifest
        this.clearButManifestFiles();
    }

    /**
     * Pull file to home.
     * @param ns Bitburner API
     * @param file filepath from source directory to pull
     */
    private async pullFile(
        file: string,
        sourceDirectoryPath: string = ''
    ) {
        // definition du chemin de telechargement
        const sourceFile = `${this.repository.baseUrl}${sourceDirectoryPath}${file}`;
        this.logger.info(`Downloading ${sourceFile} -> ${file}...`);
        // suppression du fichier si déjà existant
        if (this.ns.fileExists(file)) this.ns.rm(file)
    
        // telechargement du fichier
        if (!(await this.ns.wget(sourceFile, file, MAIN_SERVER))) {
            this.logger.err(`${sourceFile} -> ${file} download failed`);
            this.ns.exit();
        }
        this.logger.success(`${sourceFile} -> ${file} [downloaded]`);
    }
    
    /**
     * Pull files define in manifest to home.
     */
    private async pullManifestFiles() {
        // recuperation des fichiers définis dans le fichier manifest
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

        this.logger.trace(`Contents of manifest:`);
        this.logger.trace(`\t${files}`);

        for (let file of files) {
            if (!file) {
                this.logger.err(`Could not read line ${file}`);
                continue;
            }
            
            // recuperation du fichier
            await this.pullFile(file, this.repository.sourceDirectoryPath);
        }
    }

    /**
     * Suppress files not define in manifest to home.
     */
    private clearButManifestFiles() {
        // recuperation des fichiers définis dans le fichier manifest
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

        getFilepaths(this.ns, 'home', '/workspace')
            .map(x => '/' + x)
            .filter(x => files.includes(x) && x.endsWith('.ts'))
            .forEach(x => this.ns.rm(x));
    }
}
