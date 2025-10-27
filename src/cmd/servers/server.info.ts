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

    const info: ServerInfo = new ServerInfo(
        ns, 
        input.hostnameTarget === '--- All ---' ? null : ns.getServer(input.hostnameTarget)
    );

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
        
        hostnameTarget = await ns.prompt('Merci de renseigner un hostname', { type: "select", choices: ['--- All ---', ...repository.getAllIds()] }) as string
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
    private repository: ServersRepository;

    constructor(ns: NS, data: Server) {
        super(ns, data ? data.hostname : 'All');
        this.data = data;
        this.service = new ServersService(ns);
        this.repository = new ServersRepository(ns)
    }

    printData() {
		if (this.data !== null) {
            this.getMessages(this.data)
                .forEach(message => this.logger.log(message));
        } else {
            this.repository.getAllIds()
                .sort((a, b) => (this.repository.get(a).depth ?? 0) - (this.repository.get(b).depth ?? 0))
                .forEach(hostname => {
                this.logger.log(Log.getStartLog());
                this.logger.log(Log.title(hostname));
                this.logger.log('------------');

                this.getMessages(this.ns.getServer(hostname))
                    .forEach(message => this.logger.log(message));
                this.logger.log(Log.getEndLog());
            })
        }
    }
    
    getMessages(data: Server): string[] {
        return [
            Log.INFO('Organisation', data.organizationName),
            '\n',
            ...this.getInfectionData(data),
            '\n',
            ...this.getPathData(data),
            '\n',
            ...this.getPayloadData(data)
        ]
    }

    getInfectionData(data: Server): string[] {
        let messages: string[] = [
            Log.title('Nuke data'),
            Log.INFO('Unlocked : ', this.data.hasAdminRights)
        ];
        if (!this.data.hasAdminRights) {
            messages.push(Log.INFO('Unlock possible', this.nukeAchievable(data)));
            messages.push(Log.INFO('Hacking level requis', data.requiredHackingSkill));
            messages.push(Log.INFO('Ports requis', data.numOpenPortsRequired - data.openPortCount));
            messages.push(Log.INFO('Backdoor installé', data.backdoorInstalled));
        } else if (!this.data.backdoorInstalled) {
            messages.push(Log.INFO('Deep connect command', this.service.getConnectCommand(data.hostname) + ' backdoor;'));
        } else {
            messages.push(Log.INFO('Deep connect command', `connect ${data.hostname};`));
        }

        return messages;
    }

    getPathData(data: Server): string[] {
        return [
            Log.INFO('Path', ''),
            Log.INFO('Profondeur', this.repository.get(data.hostname).depth),
            this.service.getHostPathLibelle(data.hostname)
        ]
    }

    getPayloadData(data: Server): string[] {
        const percentMoney = (data.moneyMax as number) > 0 ? (data.moneyAvailable as number) / (data.moneyMax as number) : 0;

        return [
            Log.title('Hack data'),
            Log.INFO('Money', Log.money(this.ns, data.moneyAvailable as number) + ' / ' + this.ns.formatNumber(data.moneyMax as number)
                + ' (' + this.ns.formatPercent(percentMoney) + ')'),
            Log.INFO('Security level', this.ns.formatNumber(data.hackDifficulty as number) + ' >>> ' + this.ns.formatNumber(data.minDifficulty as number)
                + ' (~' + this.ns.formatNumber((data.hackDifficulty as number) - (data.minDifficulty as number)) + ')'),
            Log.INFO('RAM', this.ns.formatRam(data.maxRam))
        ]
    }

    private nukeAchievable(data: Server): boolean {
        return data.numOpenPortsRequired - data.openPortCount <= 0
            && this.ns.getHackingLevel() >= data.requiredHackingSkill
    }

}
