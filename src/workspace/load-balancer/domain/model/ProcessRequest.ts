import { ProcessRequestType } from "workspace/load-balancer/domain/model/ProcessRequestType";

export type ProcessRequest = {
    type: ProcessRequestType;
    nbThread?: number;
    target?: string;
    weight?: number;
    pid?: number[];
}