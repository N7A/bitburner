import {ProcessRequestType} from 'workspace/load-balancer/domain/model/ProcessRequestType'

/** temps maximum pour une execution */
export const timeExecutionMax: number = 60 * 60 * 1000;

export const weights: Map<ProcessRequestType, number> = new Map([
    [ProcessRequestType.SHARE_RAM, 1],
    [ProcessRequestType.HACK, 1],
    [ProcessRequestType.SETUP_HACK, 1]
])