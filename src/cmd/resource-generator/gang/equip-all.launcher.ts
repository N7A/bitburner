//#region Constants
const EQUIP_SCRIPT = 'workspace/resource-generator/gang/equip-member.daemon.ts';
//#endregion Constants

export async function main(ns: NS) {
    let availableMembers: string[] = ns.gang.getMemberNames()
        .filter(name => !ns.isRunning(EQUIP_SCRIPT, 'home', name));
        
    for (const name of availableMembers) {
        // launch setup
        ns.run(EQUIP_SCRIPT, 1, name);
    }
}