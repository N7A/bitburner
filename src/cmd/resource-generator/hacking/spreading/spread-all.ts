import { ServersService } from 'workspace/servers/servers.service';

const COPY_SCRIPT = 'workspace/resource-generator/hacking/spreading/copy-toolkit.launcher.ts';

export async function main(ns: NS) {
    const serversService = new ServersService(ns);
    const executableServer = Array.from(new Set(serversService.getAllExecutable())).filter(x => x !== 'home')
    executableServer.forEach(x => ns.run(COPY_SCRIPT, 1, x));
}