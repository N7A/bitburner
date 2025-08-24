import { ServerData } from 'workspace/servers/domain/model/ServerData'
import { UnlockRequirements } from 'workspace/servers/domain/model/UnlockRequirements'
import {PortProgram, getPortPrograms} from 'workspace/resource-generator/hacking/model/PortProgram'
import { ServersRepository } from 'workspace/servers/domain/servers.repository'

export async function main(ns: NS, targetHost: string) {
    const serversRepository = new ServersRepository(ns);

    // load input arguments
    const input: InputArg = getInput(ns, targetHost);

    let result: boolean = true;

	// load host data
	const data: ServerData = serversRepository.get(input.hostnameTarget) as ServerData;
	const requirements: UnlockRequirements = data.unlockRequirements
    const serverData = ns.getServer(input.hostnameTarget);
    
	// check accès au root
	if (serverData.hasAdminRights) {
		return true;
	}

	// récupération des ouvertures de port nécessaires
	const closedPorts = getClosedPortProgram(ns, serverData);
	let portOpener = canOpenPorts(ns, requirements.numOpenPortsRequired as number, serverData?.openPortCount as number, closedPorts)
	if (typeof portOpener === 'boolean') {
		if(!portOpener) {
			ns.tprint('INFO', ' ', `${input.hostnameTarget} closed ports : `, closedPorts.map(x => x.filename));
		}
		return portOpener;
	}

	// open ports
	for (const programPort of portOpener as PortProgram[]) {
		result = result && programPort.program(input.hostnameTarget);
	}
	
	return result;
}

//#region Input arguments
type InputArg = {
    /** Serveur cible */
    hostnameTarget: string;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS, hostnameTarget: string): InputArg {
    let result: InputArg = {
        hostnameTarget: (ns.args[0] ?? hostnameTarget) as string
    };

    return result;
}
//#endregion Input arguments

function getClosedPortProgram(ns: NS, server: Server): PortProgram[] {
    return getPortPrograms(ns).filter(program => !server[program.property as keyof Server]);
}

/**
 * Returns true if player is able to gain or already has root access to `host`, returns false otherwise.
 * 
 * Validates `host` parameter. Checks for presence of 'NUKE.exe', without which you can't root any server. Then checks which ports need to be opened and which port opening programs are currently available on 'home'.
 * 
 * @param {string} server Required. Valid hostname.
 * 
 * @return {boolean} Returns true if player is able to gain or already has root access to `host`, returns false otherwise.
 */
function canOpenPorts(ns: NS, numOpenPortsRequired: number, openPortCount: number, closedPortProgram: PortProgram[]): boolean | PortProgram[] {
    // check si nombre de port ouvert actuellement suffissant
    const portsRemaining = numOpenPortsRequired - openPortCount;
    if (portsRemaining <= 0) {
        return true;
    }

    // check si nombre de programme suffissant pour ouvrir les ports manquants
    let portOpener = getUsefulPortProgram(ns, closedPortProgram);
    if (portOpener.length >= portsRemaining) {
        return portOpener;
    } else {
        return false;
    }
}

function getUsefulPortProgram(ns: NS, closedPortProgram: PortProgram[]) {
    let availablePortProgram = getAvailablePortProgram(ns)
    
    return closedPortProgram.filter(program => availablePortProgram.map(x => x.filename).includes(program.filename))
}

export function getAvailablePortProgram(ns: NS) {
    return getPortPrograms(ns).filter(program => ns.fileExists(program.filename, 'home'));
}
