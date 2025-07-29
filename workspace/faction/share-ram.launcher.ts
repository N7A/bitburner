import * as Referentiel from 'workspace/referentiel'
import {execFitRam} from 'workspace/load-balancer/fit-ram.service'
import {ScriptParameters} from 'workspace/load-balancer/model/ExecutionServer'
import * as OwnedServersRepository from 'workspace/domain/owned-servers.repository'

//#region Constantes
const scriptFilename: string = 'share-ram.looper.ts'
//#endregion Constantes

/** 
 * @param {NS} ns
*/
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
		[{scriptsFilepath: Referentiel.FACTION_DIRECTORY + '/' + scriptFilename} as ScriptParameters]
	);
}
