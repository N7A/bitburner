import * as Log from 'workspace/frameworks/logging';
import * as ServersRepository from 'workspace/domain/servers/servers.repository';

/**
 * Affiche les données utiles pour backdoor un serveur.
 * @param ns 
 */
export async function main(ns: NS) {
    const input: InputArg = getInput(ns);

    ns.tprint(Log.getStartLog());
    ns.tprint('Analyse');
    ns.tprint('-------');
    ns.tprint('');

    const serverData = ns.getServer(input.hostnameTarget);

    printData(ns, serverData);

    ns.tprint(Log.getEndLog());
}

function nukeAchievable(ns: NS, hostToHack: string): boolean {
    return ns.getServerNumPortsRequired(hostToHack) == 0
        && ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(hostToHack)
}

function printData(ns: NS, data: Server) {
    var dataMessages: string[] = []
    dataMessages.push('root access : ' + data.hasAdminRights)
    if (!data.hasAdminRights) {
        dataMessages.push('nuke achievable : ' + nukeAchievable(ns, data.hostname))
    }
    dataMessages.push('Backdoor installé : ' + data.backdoorInstalled);
    dataMessages.push('Organisation : ' + data.organizationName);

    dataMessages.push('Money : ' + Log.money(ns, data.moneyAvailable as number) + ' / ' + ns.formatNumber(data.moneyMax as number)
        + ' (~' + Log.money(ns, (data.moneyMax as number) - (data.moneyAvailable as number)) + ')');
    dataMessages.push('Security level : ' + ns.formatNumber(data.hackDifficulty as number) + ' >>> ' + ns.formatNumber(data.minDifficulty as number)
        + ' (~' + ns.formatNumber((data.hackDifficulty as number) - (data.minDifficulty as number)) + ')');
    
    for (const message of dataMessages) {
        ns.tprint(message);
    }
    ns.tprint('Path : ', ServersRepository.getHostPathLibelle(ns, data.hostname));
    ns.tprint('Deep connect command : ', ServersRepository.getConnectCommand(ns, data.hostname) + ' backdoor;');

    ns.tprint(data.hostname)
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
    if (!ns.args[0]) {
        ns.tprint('ERROR', ' ', 'Merci de renseigner un hostname');
        ns.exit();
    }

    return {
        hostnameTarget: (ns.args[0] as string)
    };
}
//#endregion Input parameters
