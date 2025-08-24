import { ServersService } from 'workspace/servers/servers.service';

export function getScanTarget(ns: NS): string[] {
    const serversService = new ServersService(ns);
    // load targets
    return serversService.getAllUnscanned();
}