import { ServersService } from 'workspace/servers/servers.service';
import { main as copyToolkit } from 'workspace/resource-generator/hacking/spreading/copy-toolkit.launcher'

export async function main(ns: NS) {
    const serversService = new ServersService(ns);
    const executableServer = Array.from(new Set(serversService.getAllExecutable())).filter(x => x !== 'home')
    executableServer.forEach(x => copyToolkit(ns, x))
}