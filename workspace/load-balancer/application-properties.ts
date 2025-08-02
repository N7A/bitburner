import {OrderType} from 'workspace/domain/executions/model/Order'

/** temps maximum pour une execution */
export const timeExecutionMax: number = 60 * 60 * 1000;

export const weights: Map<OrderType, number> = new Map([
    [OrderType.SHARE_RAM, 1],
    [OrderType.HACK, 1],
    [OrderType.SETUP_HACK, 1]
])