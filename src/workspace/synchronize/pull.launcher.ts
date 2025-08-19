import { gitRepositoryBaseUrl, manifestFilepath, sourceDirectoryPath } from "workspace/synchronize/application-properties";
import { GitHubConnector } from "workspace/synchronize/git-connector.service";
import { GitRepository } from "workspace/synchronize/model/GitRepository";
import { TerminalLogger } from "workspace/common/TerminalLogger";

export const repoParams: GitRepository = {
    baseUrl: gitRepositoryBaseUrl,
    manifestFilepath: manifestFilepath,
    sourceDirectoryPath: sourceDirectoryPath
};

export async function main(ns: NS) {
    const logger = new TerminalLogger(ns);
    const git = new GitHubConnector(ns, repoParams);

    await git.pullAll();

    logger.info('SUCCESS', ' ', 'Pull from manifest');
}