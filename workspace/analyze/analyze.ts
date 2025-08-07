import * as Log from 'workspace/frameworks/logging';
import * as ServersRepository from 'workspace/domain/servers/servers.repository';

/**
 * Affiche les données utiles pour backdoor un serveur.
 * @param ns 
 */
export async function main(ns: NS) {
    const input: InputArg = getInput(ns);

    setupDashboard(ns, input);

    ns.print(Log.getStartLog());

    const serverData = ns.getServer(input.hostnameTarget);

    printData(ns, serverData);

    ns.print(Log.getEndLog());
}

// TODO : use function from main class
function nukeAchievable(ns: NS, hostToHack: string): boolean {
    return ns.getServerNumPortsRequired(hostToHack) == 0
        && ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(hostToHack)
}

function printData(ns: NS, data: Server) {
    ns.print(Log.INFO('Organisation', data.organizationName));
    ns.print(Log.INFO('Unlocked : ', data.hasAdminRights));
    if (!data.hasAdminRights) {
        ns.print(Log.INFO('Unlock possible', nukeAchievable(ns, data.hostname)));
        ns.print(Log.INFO('Backdoor installé', data.backdoorInstalled));
    } else if (!data.backdoorInstalled) {
        ns.print(Log.INFO('Deep connect command', ServersRepository.getConnectCommand(ns, data.hostname) + ' backdoor;'));
    }
    ns.print(Log.INFO('Path', ServersRepository.getHostPathLibelle(ns, data.hostname)));
    ns.print(Log.INFO('Money', Log.money(ns, data.moneyAvailable as number) + ' / ' + ns.formatNumber(data.moneyMax as number)
        + ' (~' + Log.money(ns, (data.moneyMax as number) - (data.moneyAvailable as number)) + ')'));
    ns.print(Log.INFO('Security level', ns.formatNumber(data.hackDifficulty as number) + ' >>> ' + ns.formatNumber(data.minDifficulty as number)
        + ' (~' + ns.formatNumber((data.hackDifficulty as number) - (data.minDifficulty as number)) + ')'));
}

//#region Input parameters
type InputArg = {
    /** Serveur cible */
    hostnameTarget: string;
}

/**
 * Load input parameters
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS): InputArg {
    if (ns.args[0] === undefined) {
        ns.tprint('ERROR', ' ', 'Merci de renseigner un hostname');
        ns.exit();
    }

    return {
        hostnameTarget: (ns.args[0] as string)
    };
}
//#endregion Input parameters

//#region Dashboard
function setupDashboard(ns: NS, input: InputArg) {
    ns.disableLog("ALL");
    ns.clearLog();
    
    Log.initTailTitle(ns, Log.target(input.hostnameTarget), 'info');
    
    ns.ui.openTail();
}
//#endregion Dashboard
