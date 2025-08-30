import { ServersRepository } from 'workspace/servers/domain/servers.repository'

export async function main(ns: NS) {
    const input: InputArg = await getInput(ns);

	ns.disableLog('ALL')
	
	ns.print(`Serveur recherché : ${input.targetHostname}`)

	const finder: ServerFinder = new ServerFinder(ns);

	const path = finder.getServerPath(input.targetHostname);

	ns.print(path.join(' > '))
}

//#region Input arguments
type InputArg = {
	/** Serveur cible */
	targetHostname: string;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
 async function getInput(ns: NS): Promise<InputArg> {
	let targetHostname: string;
	if (ns.args[0] === undefined) {
		const repository = new ServersRepository(ns);
		
		targetHostname = await ns.prompt('Merci de renseigner un hostname', { type: "select", choices: repository.getAllIds() }) as string
	} else {
		targetHostname = (ns.args[0] as string);
	}

	return {
		targetHostname: targetHostname
	};
 }
//#endregion Input arguments

class ServerFinder {
	private ns: NS;

	constructor(ns: NS) {
		this.ns = ns;
	}

	getServerPath(targetHostname: string) {
		return this.recurseStep('home', [], targetHostname, []);
	}

	private recurseStep(host: string, ignore: string[], name: string, path: string[]): string[] {
		if (host === name) {
			return [...path, host];
		}

		const adjacents = this.ns.scan(host);
		for (const adjacent of adjacents) {
			if (ignore.includes(adjacent)) {
				continue;
			}

			const competedPath = this.recurseStep(adjacent, [...ignore, adjacent], name, [...path, host]);
			
			if (competedPath.includes(name)) {
				return competedPath;
			}
		}

		return path;
	}

}
