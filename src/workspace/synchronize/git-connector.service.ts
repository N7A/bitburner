import { GitRepository } from 'workspace/synchronize/model/GitRepository';
import { getFilepaths } from 'workspace/socle/utils/file';
import * as Referentiel from 'workspace/common/referentiel'
import { Logger } from 'workspace/socle/Logger';
import { LogLevel } from "workspace/socle/model/LogLevel";

/**
 * Service de connection à un repository GitHub.
 * 
 * @remarks RAM cost: 1.2 GB
 */
export class GitHubConnector {
    private ns: NS;
    private repository: GitRepository;
    private logger: Logger;

    /**
     * Service de connection à un repository GitHub.
     * @param ns Bitburner API
     * @param repository repository to connect
     */
    constructor(ns: NS, repository: GitRepository) {
        this.ns = ns;
        this.repository = repository;
        this.logger = new Logger(ns);
    }

    /**
     * Synchronize files from Git repository to home.
     * 
     * @remarks RAM cost: 1.2 GB
     */
    async pullAll() {
        // recupération du fichier manifest
        await this.pullFile(this.repository.manifestFilepath);
        // recupération des fichiers définis dans le manifest
        await this.pullManifestFiles();
        // suppression des fichiers non définis dans le manifest
        this.clearButManifestFiles();
        this.logger.success('Pull from manifest [done]');
    }

    /**
     * Pull file to home.
     * @param ns Bitburner API
     * @param file filepath from source directory to pull
     * 
     * @remarks RAM cost: 0 GB
     */
    private async pullFile(
        file: string,
        sourceDirectoryPath: string = ''
    ) {
        // definition du chemin de telechargement
        const sourceFile = `${this.repository.baseUrl}${sourceDirectoryPath}${file}`;
        this.logger.trace(`Downloading ${sourceFile} -> ${file}...`);
    
        // telechargement du fichier
        if (!(await this.ns.wget(sourceFile, file, Referentiel.MAIN_HOSTNAME))) {
            this.logger.err(`${sourceFile} -> ${file} download failed`);
            this.ns.exit();
        }
        this.logger.success(`${sourceFile} -> ${file} [downloaded]`, LogLevel.TRACE);
    }
    
    /**
     * Pull files define in manifest to home.
     * 
     * @remarks RAM cost: 0 GB
     */
    private async pullManifestFiles() {
        // recuperation des fichiers définis dans le fichier manifest
        const manifestFiles = (this.ns.read(this.repository.manifestFilepath) as string)
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
        this.logger.trace(`\t${manifestFiles}`);

        this.logger.refreshLoadingBar(0, manifestFiles.length);

        let successNumber: number = 0;
        let failNumber: number = 0;
        
        for (const [index, file] of manifestFiles.entries()) {
            if (!file) {
                this.logger.err(`Could not read line ${file}`);
                failNumber++
                this.logger.refreshLoadingBar(index + 1, manifestFiles.length);
                continue;
            }

            // recuperation du fichier
            await this.pullFile(file, this.repository.sourceDirectoryPath);
            successNumber++
            
            this.logger.refreshLoadingBar(index + 1, manifestFiles.length);
        }
        
        this.logger.success(`${successNumber} files pulled`);
        if (failNumber > 0) {
            this.logger.err(`${failNumber} files not read`);
        }
    }

    /**
     * Suppress files not define in manifest to home.
     * 
     * @remarks RAM cost: 1.2 GB
     */
    private clearButManifestFiles() {
        // recuperation des fichiers définis dans le fichier manifest
        const manifestFiles = (this.ns.read(this.repository.manifestFilepath) as string)
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

        const filesToRemove = [
            ...getFilepaths(this.ns, Referentiel.MAIN_HOSTNAME, 'workspace'), 
            ...getFilepaths(this.ns, Referentiel.MAIN_HOSTNAME, 'cmd')
        ].map(x => '/' + x)
            .filter(x => !manifestFiles.includes(x) && x.endsWith(Referentiel.SCRIPT_EXTENSION));
        filesToRemove.forEach(x => this.ns.rm(x));
        this.logger.success(`${filesToRemove.length} files removed`);
    }
}
