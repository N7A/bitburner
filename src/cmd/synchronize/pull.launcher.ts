import { gitRepositoryBaseUrl, manifestFilepath, sourceDirectoryPath } from "workspace/synchronize/application-properties";
import { GitHubConnector } from "workspace/synchronize/git-connector.service";
import { GitRepository } from "workspace/synchronize/model/GitRepository";
import { Logger } from "workspace/socle/Logger";
import { Dashboard } from "workspace/socle/interface/dashboard";

export const repoParams: GitRepository = {
    baseUrl: gitRepositoryBaseUrl,
    manifestFilepath: manifestFilepath,
    sourceDirectoryPath: sourceDirectoryPath
};

export async function main(ns: NS) {
    const logger = new Logger(ns);
    const git = new GitHubConnector(ns, repoParams);

    setupDashboard(ns);

    await git.pullAll();

    logger.success('Pull from manifest [ended]');
}

//#region Dashboard
/**
 * 
 * @remarks RAM cost : 0 GB
 */
function setupDashboard(ns: NS) {
    ns.disableLog("ALL");
    ns.clearLog();
    
    const dashboard = new Dashboard(ns, 'Synchronize', {icon: '🔄', role: 'launcher'});
    dashboard.initTailTitle();
    
    ns.ui.openTail();
}
//#endregion Dashboard