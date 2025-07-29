import * as Referentiel from 'workspace/referentiel'
import {execFitRam} from 'workspace/load-balancer/fit-ram.service'
import {ScriptParameters} from 'workspace/load-balancer/model/ExecutionServer'
import * as OwnedServersRepository from 'workspace/domain/owned-servers.repository'
import * as ServersRepository from 'workspace/domain/servers/servers.repository'
import {main as bestHackFitTarget} from 'workspace/hacking/payload/payload.selector'

export async function main(ns: NS) {
    const scripts = [
        Referentiel.HACKING_DIRECTORY + '/payload/grow.looper.ts',
        Referentiel.HACKING_DIRECTORY + '/payload/weaken.looper.ts',
        Referentiel.HACKING_DIRECTORY + '/payload/hack.looper.ts',
        Referentiel.HACKING_DIRECTORY + '/payload/weaken.looper.ts'
    ];

    const targets: string[] = ServersRepository.getAll(ns);

    const targetHost: string | undefined = await bestHackFitTarget(ns, targets);

    const availableServers: string[] = OwnedServersRepository.getAll(ns).map(x => x.hostname);

    if (targetHost === undefined) {
        ns.exit();
    }

    ns.tprint(`Fit target : ${targetHost}`);

	execFitRam(
		ns, 
		availableServers,
		scripts.map(x => {
            return {scriptsFilepath: x, args: [targetHost]} as ScriptParameters
        })
	);
}