import { ServersRepository } from 'workspace/servers/domain/servers.repository';
import * as Log from 'workspace/socle/utils/logging';
import { Alert } from 'workspace/notification/alert';

export async function main(ns: NS) {
    const input: InputArg = await getInput(ns);

    const main: UnlockedServerAlert = new UnlockedServerAlert(ns, input.targetHostname);
    
    await main.run();
}

//#region Input parameters
type InputArg = {
    /** Serveur surveillé */
    targetHostname: string;
}

/**
 * Load input parameters
 * @param ns Bitburner API
 * @returns 
 */
 async function getInput(ns: NS): Promise<InputArg> {
     let targetHostname: string;
     if (ns.args[0] === undefined) {
         const repository = new ServersRepository(ns);
         
         targetHostname = await ns.prompt('Merci de renseigner un serveur à notifier', { type: "select", choices: repository.getAllIds() }) as string
     } else {
         targetHostname = (ns.args[0] as string);
     }
 
     return {
         targetHostname: targetHostname
     };
}
//#endregion Input parameters

class UnlockedServerAlert extends Alert {
    private targetHostname: string;
    private serversRepository: ServersRepository;

    constructor(ns: NS, targetHostname: string) {
        super(ns);
        this.targetHostname = targetHostname;
        this.serversRepository = new ServersRepository(ns);
    }

    waitingEvent(): boolean {
        return this.serversRepository.get(this.targetHostname)?.state.unlocked;
    }

    getAlertMessage(): string {
        return `Serveur ${Log.target(this.targetHostname)} unlocked`;
    }
}