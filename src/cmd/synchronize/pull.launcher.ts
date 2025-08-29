import { gitRepositoryBaseUrl, manifestFilepath, sourceDirectoryPath } from "workspace/synchronize/application-properties";
import { GitHubConnector } from "workspace/synchronize/git-connector.service";
import { GitRepository } from "workspace/synchronize/model/GitRepository";
import { TerminalLogger } from "workspace/socle/TerminalLogger";
import * as Log from 'workspace/socle/utils/logging';

export const repoParams: GitRepository = {
    baseUrl: gitRepositoryBaseUrl,
    manifestFilepath: manifestFilepath,
    sourceDirectoryPath: sourceDirectoryPath
};

export async function main(ns: NS) {
    const logger = new TerminalLogger(ns);
    const git = new GitHubConnector(ns, repoParams);

    setupDashboard(ns);

    await git.pullAll();

    logger.success('Pull from manifest');
}

//#region Dashboard
/**
 * 
 * @remarks RAM cost : 0 GB
 */
function setupDashboard(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();
    
    Log.initTailTitle(ns, 'Synchronize', 'launcher');
    
    ns.ui.openTail();
}
//#endregion Dashboard