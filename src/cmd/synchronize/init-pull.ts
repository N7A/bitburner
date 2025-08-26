//#region Constants
export const repoParams = {
    baseUrl: "https://raw.githubusercontent.com/N7A/bitburner/refs/heads/main/src",
    pullLauncherScript: "/cmd/synchronize/pull.launcher.ts",
    pullLauncherDependencies: [
        "/workspace/synchronize/application-properties.ts",
        "/workspace/synchronize/git-connector.service.ts",
        "/workspace/synchronize/model/GitRepository.ts",
        "/workspace/common/TerminalLogger.ts",
        "/workspace/common/model/LogLevelLitteral.ts",
        "/workspace/common/model/LogLevel.ts",
        "/workspace/common/application-properties.ts"
    ]
};
//#endregion Constants

export async function main(ns: NS) {
    // telechargement des fichiers nécessaires au telechargement complet
    for (const dependency of repoParams.pullLauncherDependencies) {
        await pullFile(ns, dependency);
    }
    await pullFile(ns, repoParams.pullLauncherScript);

    ns.tprintf(`INFO    > SUCCESS Pulled initial files !`);
    ns.tprintf(`INFO    > Running download script...`);

    await ns.sleep(250);
    
    // lancement du script de telechargement complet
    ns.run(repoParams.pullLauncherScript);
}

/**
 * Pull file to home.
 * @param ns Bitburner API
 * @param file filepath from source directory to pull
 */
async function pullFile(
    ns: NS,
    file: string
) {
    // definition du chemin de telechargement
    const sourceFile = `${repoParams.baseUrl}${file}`;
    ns.tprintf(
        `INFO    > Downloading ${sourceFile} -> ${file}`
    );
    // suppression du fichier si déjà existant
    if (ns.fileExists(file)) ns.rm(file)

    // telechargement du fichier
    if (!(await ns.wget(sourceFile, file, "home"))) {
        ns.tprintf(`ERROR   > ${sourceFile} -> ${file} failed.`);
        ns.exit();
    }
}
    