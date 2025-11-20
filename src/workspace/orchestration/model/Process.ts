import { ResourceType } from "workspace/common/model/Resource";

export type Process = {
    need?: ResourceType; // + amount ?
    produce?: ResourceType;
    scriptUp: string;
    scriptDown: string;
}

export const PROCESSES: Process[] = [
    {
        need: ResourceType.RAM,
        scriptUp: 'cmd/resource-generator/hacknet/ipvgo/play-board.daemon.ts',
        scriptDown: null
    },
    {
        need: ResourceType.RAM,
        produce: ResourceType.FACTION_REPUTATION,
        scriptUp: 'cmd/resource-generator/faction/get-backup-bonus.scheduler.ts',
        scriptDown: null
    }
]