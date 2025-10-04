import * as Log from 'workspace/socle/utils/logging';
import { ServersService } from 'workspace/servers/servers.service';
import { Info } from 'workspace/socle/interface/info';
import { ServersRepository } from 'workspace/servers/domain/servers.repository'

/**
 * Affiche les données utiles pour backdoor un serveur.
 * @param ns 
 */
export async function main(ns: NS) {
    const input: InputArg = await getInput(ns);

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
async function getInput(ns: NS): Promise<InputArg> {
    let hostnameTarget: string;
    if (ns.args[0] === undefined) {
        const repository = new ServersRepository(ns);
        
        hostnameTarget = await ns.prompt('Merci de renseigner un hostname', { type: "select", choices: repository.getAllIds() }) as string
    } else {
        hostnameTarget = (ns.args[0] as string);
    }

    return {
        hostnameTarget: hostnameTarget
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
        this.ns.print('\n');
        this.ns.print(Log.title('Nuke data'));
        this.ns.print(Log.INFO('Unlocked : ', this.data.hasAdminRights));
        if (!this.data.hasAdminRights) {
            this.ns.print(Log.INFO('Unlock possible', this.nukeAchievable()));
            this.ns.print(Log.INFO('Hacking level requis', this.data.requiredHackingSkill));
            this.ns.print(Log.INFO('Ports requis', this.data.numOpenPortsRequired - this.data.openPortCount));
            this.ns.print(Log.INFO('Backdoor installé', this.data.backdoorInstalled));
        } else if (!this.data.backdoorInstalled) {
            this.ns.print(Log.INFO('Deep connect command', this.service.getConnectCommand(this.data.hostname) + ' backdoor;'));
        } else {
            this.ns.print(Log.INFO('Deep connect command', `connect ${this.data.hostname};`));
        }
        this.ns.print(Log.INFO('Path', ''));
        this.ns.print(this.service.getHostPathLibelle(this.data.hostname));
        this.ns.print('\n');
        this.ns.print(Log.title('Hack data'));
        const percentMoney = (this.data.moneyMax as number) > 0 ? (this.data.moneyAvailable as number) / (this.data.moneyMax as number) : 0;
        this.ns.print(Log.INFO('Money', Log.money(this.ns, this.data.moneyAvailable as number) + ' / ' + this.ns.formatNumber(this.data.moneyMax as number)
            + ' (' + this.ns.formatPercent(percentMoney) + ')'));
        this.ns.print(Log.INFO('Security level', this.ns.formatNumber(this.data.hackDifficulty as number) + ' >>> ' + this.ns.formatNumber(this.data.minDifficulty as number)
            + ' (~' + this.ns.formatNumber((this.data.hackDifficulty as number) - (this.data.minDifficulty as number)) + ')'));
            this.ns.print(Log.INFO('RAM', this.ns.formatRam(this.data.maxRam)));
    }
    
    private nukeAchievable(): boolean {
        return this.data.numOpenPortsRequired - this.data.openPortCount <= 0
            && this.ns.getHackingLevel() >= this.data.requiredHackingSkill
    }

}
