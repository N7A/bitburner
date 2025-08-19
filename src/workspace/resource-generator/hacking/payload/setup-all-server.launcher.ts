import { ServersService } from 'workspace/servers/servers.service';
import * as Log from 'workspace/frameworks/logging';

//#region Constants
const ENABLE_SETUP_SCRIPT = "workspace/load-balancer/domain/setup.enable.ts";
//#endregion Constants

export async function main(ns: NS) {
    ns.print(Log.getStartLog())
    // load host data
    var serversHackable: string[] = ServersService.getAllHackable(ns);

    ns.print('Hackable : ', serversHackable)
    for (const server of serversHackable) {
        // launch setup
        ns.run(ENABLE_SETUP_SCRIPT, 1, server);
    }
}