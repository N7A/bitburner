import { HackData } from "workspace/servers/domain/model/HackData";
import { UnlockRequirements } from "workspace/servers/domain/model/UnlockRequirements";
import { ServerState } from "workspace/servers/domain/model/ServerState";
import { ServerType } from "workspace/servers/domain/model/ServerType";

export type ServerData = {
    name: string;
    type: ServerType;
    parent?: string;
    depth?: number;
    state: ServerState;
    unlockRequirements: UnlockRequirements;
    hackData: HackData;
}