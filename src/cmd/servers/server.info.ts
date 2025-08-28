import * as Log from 'workspace/socle/utils/logging';
import { ServersService } from 'workspace/servers/servers.service';
import { TerminalLogger } from 'workspace/socle/TerminalLogger';
import { Info } from 'workspace/socle/interface/info';

/**
 * Affiche les données utiles pour backdoor un serveur.
 * @param ns 
 */
export async function main(ns: NS) {
    const input: InputArg = getInput(ns);

    const serverData: Server = ns.getServer(input.hostnameTarget);

    const info: ServerInfo = new ServerInfo(ns, serverData);

    info.run();
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
    const logger = new TerminalLogger(ns);
    if (ns.args[0] === undefined) {
        logger.err('Merci de renseigner un hostname');
        ns.exit();
    }

    return {
        hostnameTarget: (ns.args[0] as string)
    };
}
//#endregion Input parameters

class ServerInfo extends Info {
    private data: Server;
    private service: ServersService;

    constructor(ns: NS, data: Server) {
        super(ns, data.hostname);
        this.data = data;
        this.service = new ServersService(ns);
    }

    printData() {
        this.ns.print(Log.INFO('Organisation', this.data.organizationName));
        this.ns.print(Log.INFO('Unlocked : ', this.data.hasAdminRights));
        if (!this.data.hasAdminRights) {
            this.ns.print(Log.INFO('Unlock possible', this.nukeAchievable(this.ns, this.data.hostname)));
            this.ns.print(Log.INFO('Backdoor installé', this.data.backdoorInstalled));
        } else if (!this.data.backdoorInstalled) {
            this.ns.print(Log.INFO('Deep connect command', this.service.getConnectCommand(this.data.hostname) + ' backdoor;'));
        }
        this.ns.print(Log.INFO('Path', this.service.getHostPathLibelle(this.data.hostname)));
        this.ns.print(Log.INFO('Money', Log.money(this.ns, this.data.moneyAvailable as number) + ' / ' + this.ns.formatNumber(this.data.moneyMax as number)
            + ' (~' + Log.money(this.ns, (this.data.moneyMax as number) - (this.data.moneyAvailable as number)) + ')'));
        this.ns.print(Log.INFO('Security level', this.ns.formatNumber(this.data.hackDifficulty as number) + ' >>> ' + this.ns.formatNumber(this.data.minDifficulty as number)
            + ' (~' + this.ns.formatNumber((this.data.hackDifficulty as number) - (this.data.minDifficulty as number)) + ')'));
    }
    
    // TODO : use function from main class
    private nukeAchievable(ns: NS, hostToHack: string): boolean {
        return ns.getServerNumPortsRequired(hostToHack) == 0
            && ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(hostToHack)
    }

}
