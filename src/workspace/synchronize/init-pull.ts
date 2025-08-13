
export const repoParams = {
    baseUrl: "https://raw.githubusercontent.com/N7A/bitburner/refs/heads/main/src",
    pullService: "/workspace/synchronize/git-connector.service.ts",
    pullLauncherScript: "/workspace/synchronize/pull.launcher.ts"
};

export async function main(ns: NS) {
    await pullFile(ns, repoParams.pullService);
    await pullFile(ns, repoParams.pullLauncherScript);

    ns.tprintf(`INFO   > Successfully pulled initial files!`);
    ns.tprintf(`INFO   > Running download script...`);

    await ns.sleep(250);
    
    ns.run(repoParams.pullLauncherScript);
}

/**
 * 
 * @param ns Pull file to home
 * @param file 
 */
async function pullFile(
    ns: NS,
    file: string
) {
    const sourceFile = `${repoParams.baseUrl}${file}`;
    ns.tprintf(
        `INFO   > Downloading ${sourceFile} -> ${file}`
    );
    if (ns.fileExists(file)) ns.rm(file)

    if (!(await ns.wget(sourceFile, file, "home"))) {
        ns.tprintf(`ERROR  > ${sourceFile} -> ${file} failed.`);
        ns.exit();
    }
}
    