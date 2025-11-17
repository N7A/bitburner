import { ResourceType } from "workspace/common/model/Resource";

export type Process = {
    need?: ResourceType; // + amount ?
    produce?: ResourceType;
    scriptUp: string;
    scriptDown: string;
}