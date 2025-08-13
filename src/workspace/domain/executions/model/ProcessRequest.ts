export type ProcessRequest = {
    type: ProcessRequestType;
    target?: string;
    weight?: number;
    pid?: number[];
}

export enum ProcessRequestType {
    SHARE_RAM,
    HACK,
    SETUP_HACK
}