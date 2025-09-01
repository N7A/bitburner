import { ProcessRequestType } from "workspace/load-balancer/domain/model/ProcessRequestType";
import { ExecutionRequest } from "workspace/load-balancer/model/ExecutionServer";

export type ProcessRequest = {
    id?: string;
    label?: string;
    type: ProcessRequestType;
    request?: ExecutionRequest;
    weight?: number;
    pid?: number[];
}