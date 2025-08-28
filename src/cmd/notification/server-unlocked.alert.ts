import { ServersRepository } from 'workspace/servers/domain/servers.repository';
import * as Log from 'workspace/socle/utils/logging';
import { TerminalLogger } from 'workspace/socle/TerminalLogger';
import { Alert } from 'workspace/notification/alert';

export async function main(ns: NS) {
    const input: InputArg = getInput(ns);

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
function getInput(ns: NS): InputArg {
    const logger = new TerminalLogger(ns);
    if (ns.args[0] === undefined) {
        logger.err('Merci de renseigner un serveur à notifier');
        ns.exit();
    }
    
    return {
        targetHostname: (ns.args[0] as string)
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