export async function main(ns: NS) {
	let name = ns.args[0] as string
	ns.print(`name is ${name}`)

	await recurseStep(ns, 'home', ['home'], name, ['home'])
}

async function processNode(ns: NS, host: string, name: string, path: string[]) {
	ns.print(path)
	
	if (host == name) {		
		ns.print('^^^^^^^')
		return false;
	}
	return true;
}

async function recurseStep(ns: NS, host: string, ignore: string[], name: string, path: string[]) {
	const adjacents = ns.scan(host)	
	for (const adjacent of adjacents) {
		
		path.push(adjacent)
		const proceed = await visit(ns, adjacent, ignore, name, path)
		path.pop()

		if (!proceed) {
			return false;
		}
	}

	return true;
}

async function visit(ns: NS, host: string, ignore: string[], name: string, path: string[]) {	
	if (ignore.includes(host)) return true;
	if (host.includes('box-')) return true;	
	ignore.push(host)

	const proceed = await processNode(ns, host, name, path)
	if (!proceed) {
		return false;
	}

	return await recurseStep(ns, host, ignore, name, path)
}
