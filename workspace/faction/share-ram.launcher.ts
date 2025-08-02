import * as Referentiel from 'workspace/referentiel'
import {execFitRam} from 'workspace/load-balancer/fit-ram.service'
import {ScriptParameters} from 'workspace/load-balancer/model/ExecutionServer'
import * as OwnedServersRepository from 'workspace/domain/owned-servers.repository'

//#region Constantes
const SCRIPT_FILENAME: string = Referentiel.FACTION_DIRECTORY + '/' + 'share-ram.looper.ts'
//#endregion Constantes

export async function main(ns: NS) {
	// check if script useless
	if (ns.getPlayer().factions.length === 0) {
		ns.tprint("WARN", " ", "Aucune faction rejointe, partage de RAM inutile");
		ns.exit();
	}

    const availableServers: string[] = OwnedServersRepository.getAll(ns).map(x => x.hostname);
	await execFitRam(
		ns, 
		availableServers,
		[{scriptsFilepath: SCRIPT_FILENAME} as ScriptParameters]
	);
}
