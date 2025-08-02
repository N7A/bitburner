export type Order = {
    type: OrderType;
    target?: string;
    weight?: number;
    /*args: ScriptArg[];
    pid: number;*/
}

export enum OrderType {
    SHARE_RAM,
    HACK,
    SETUP_HACK
}