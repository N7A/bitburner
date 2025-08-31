//#region Constants
export const repoParams = {
    baseUrl: "https://raw.githubusercontent.com/N7A/bitburner/refs/heads/main/src",
    pullLauncherScript: "/cmd/synchronize/pull.launcher.ts",
    pullLauncherDependencies: [
        "/workspace/synchronize/application-properties.ts",
        "/workspace/synchronize/git-connector.service.ts",
        "/workspace/synchronize/model/GitRepository.ts",
        "/workspace/socle/Logger.ts",
        "/workspace/socle/model/LogLevelLitteral.ts",
        "/workspace/socle/model/LogLevel.ts",
        "/workspace/common/log.properties.ts",
        "/workspace/referentiel.ts",
        "/workspace/socle/utils/file.ts",
        "workspace/socle/interface/dashboard"
    ]
};
const MAIN_HOSTNAME: string = 'home';
//#endregion Constants

/**
 * Pull les fichiers nécessaire à la sychronisation depuis le repository Git, puis déclenche la synchronisation.
 * @param ns Bitburner API
 * 
 * @remarks RAM cost: 1 GB
 */
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

    // TODO: supprimer le fichier init-pull ? (inutile une fois le toolkit chargé)
}

/**
 * Pull file to home.
 * @param ns Bitburner API
 * @param file filepath from source directory to pull
 * 
 * @remarks RAM cost: 0 GB
 */
async function pullFile(
    ns: NS,
    file: string
) {
    // definition du chemin de telechargement
    const sourceFile = `${repoParams.baseUrl}${file}`;
    ns.tprintf(`INFO    > Downloading ${sourceFile} -> ${file}`);

    // telechargement du fichier
    if (!(await ns.wget(sourceFile, file, MAIN_HOSTNAME))) {
        ns.tprintf(`ERROR   > ${sourceFile} -> ${file} failed.`);
        ns.exit();
    }
}
    