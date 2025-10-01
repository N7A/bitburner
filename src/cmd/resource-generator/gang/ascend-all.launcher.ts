//#region Constants
const ASCENSION_SCRIPT = 'workspace/resource-generator/gang/ascension-member.daemon.ts';
//#endregion Constants

export async function main(ns: NS) {
    let availableMembers: string[] = ns.gang.getMemberNames()
        .filter(name => !ns.isRunning(ASCENSION_SCRIPT, 'home', name));
        
    for (const name of availableMembers) {
        // launch setup
        ns.run(ASCENSION_SCRIPT, {preventDuplicates: true}, name);
    }
}