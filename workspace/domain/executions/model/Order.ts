export type Order = {
    type: OrderType;
    target?: string;
    weight?: number;
    pid?: number[];
    /*args: ScriptArg[];*/
}

export enum OrderType {
    SHARE_RAM,
    HACK,
    SETUP_HACK
}