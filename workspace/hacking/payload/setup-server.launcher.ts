import * as ServersRepository from 'workspace/domain/servers/servers.repository';
import * as TargetsRepository from 'workspace/domain/targets/targets.repository';
import * as OwnedServersRepository from 'workspace/domain/owned-servers.repository'
import { Targets } from 'workspace/domain/targets/model/Targets';
import * as Log from 'workspace/frameworks/logging';
import * as Referentiel from 'workspace/referentiel'

export async function main(ns: NS) {
    ns.print(Log.getStartLog())
    // load targets
    var targets: Targets = TargetsRepository.get(ns);
    const ownedServers = OwnedServersRepository.getAll(ns);
    // load host data
    var serversHackable: string[] = ServersRepository.getAll(ns).filter(x => {
        return !(targets.scanTargets.includes(x)
            || targets.unlockTargets.includes(x))
    }).filter(x => !ownedServers.map(y => y.hostname).includes(x));

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