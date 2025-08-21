import { ProcessRequestType } from "workspace/load-balancer/domain/model/ProcessRequestType";

export type ProcessRequest = {
    type: ProcessRequestType;
    target?: string;
    weight?: number;
    pid?: number[];
}