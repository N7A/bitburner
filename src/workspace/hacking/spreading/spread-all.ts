import { ServersService } from 'workspace/servers/servers.service';
import { main as copyToolkit } from 'workspace/hacking/spreading/copy-toolkit.launcher'

export async function main(ns: NS) {
    const executableServer = Array.from(new Set(ServersService.getAllExecutable(ns))).filter(x => x !== 'home')
    executableServer.forEach(x => copyToolkit(ns, x))
}