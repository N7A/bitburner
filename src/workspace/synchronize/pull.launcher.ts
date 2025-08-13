import { gitRepositoryBaseUrl, manifestFilepath, sourceDirectoryPath } from "workspace/synchronize/application-properties";
import { GitConnector, GitRepository } from "workspace/synchronize/git-connector.service";

export const repoParams: GitRepository = {
    baseUrl: gitRepositoryBaseUrl,
    manifestFilepath: manifestFilepath,
    sourceDirectoryPath: sourceDirectoryPath
};

export async function main(ns: NS) {
    const git = new GitConnector(ns, repoParams);

    await git.pullAll();

    ns.tprint('SUCCESS', ' ', 'Pull from manifest');
}