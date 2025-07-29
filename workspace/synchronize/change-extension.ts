import * as Referentiel from 'workspace/referentiel'

const DIRECTORY_FILTER = Referentiel.WORKSPACE_DIRECTORY + '/';

export async function main(ns: NS) {
    // rm workspace
    getWorkspaceScripts(ns).forEach(x => {
        ns.rm(x, 'home')
    });

    // mv *.js to *.ts
    getJsScripts(ns).forEach(x => {
        ns.mv('home', x, x.substring(0, x.lastIndexOf('.js')) + '.ts')
    });
}

export function getJsScripts(ns: NS): string[] {
    return getWorkspaceScripts(ns).filter((x: string) => x.endsWith('.js'));
}

export function getWorkspaceScripts(ns: NS): string[] {
    return ns.ls('home', DIRECTORY_FILTER)
        .filter((x: string) => x.startsWith(DIRECTORY_FILTER));
}
