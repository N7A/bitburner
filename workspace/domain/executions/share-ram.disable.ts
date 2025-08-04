import * as ExecusionsRepository from 'workspace/domain/executions/executions.repository'
import {Order, OrderType} from 'workspace/domain/executions/model/Order'

export async function main(ns: NS) {
    const shareRamOrder: Order = {
        type: OrderType.SHARE_RAM
    }
    ExecusionsRepository.remove(ns, shareRamOrder);
}