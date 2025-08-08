import { ServersService } from 'workspace/servers/servers.service';
import * as OwnedServersRepository from 'workspace/domain/owned-servers.repository'
import * as Log from 'workspace/frameworks/logging';
import * as Referentiel from 'workspace/referentiel'

export async function main(ns: NS) {
    ns.print(Log.getStartLog())
    // load targets
    const ownedServers = OwnedServersRepository.getAll(ns);
    // load host data
    var serversHackable: string[] = ServersService.getAllUnlocked(ns)
        .filter(x => !ownedServers.map(y => y.hostname).includes(x));

    let scripts = [
        Referentiel.HACKING_DIRECTORY + '/payload/grow.looper.ts',
        Referentiel.HACKING_DIRECTORY + '/payload/weaken.looper.ts',
        Referentiel.HACKING_DIRECTORY + '/payload/hack.looper.ts',
        Referentiel.HACKING_DIRECTORY + '/payload/weaken.looper.ts'
    ]

    const nbPayload: number = 4;
    let payloadExec: number[] = []
    ns.print('Hackable : ', serversHackable)
    for (const server of serversHackable) {
        // kill payload scripts
        for (const script of scripts) {
            for (const owned of ownedServers) {
                ns.kill(script, owned.hostname, server);
            }
            ns.scriptKill(script, server);
        }
        // launch setup
        const pidExecution = ns.run('workspace/hacking/payload/setup-server.worker.ts', 1, server);
        if(pidExecution == 0) {
            payloadExec.push(pidExecution);
        }
        
        while (payloadExec.length >= nbPayload) {
            await ns.asleep(500);
            payloadExec = payloadExec.filter(x => ns.isRunning(x));
        }
    }
}