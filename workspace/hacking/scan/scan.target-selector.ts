import { ServersService } from 'workspace/servers/servers.service';

export function getScanTarget(ns: NS): string[] {
    // load targets
    return ServersService.getAllUnscanned(ns);
}