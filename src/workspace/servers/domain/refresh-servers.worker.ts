import { ServersService } from 'workspace/servers/servers.service';

export async function main(ns: NS) {
    new ServersService(ns).refreshAll();
}