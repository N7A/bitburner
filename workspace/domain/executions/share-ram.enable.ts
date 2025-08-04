import * as ExecusionsRepository from 'workspace/domain/executions/executions.repository'
import {Order, OrderType} from 'workspace/domain/executions/model/Order'

export async function main(ns: NS) {
    // si déjà actif
    if (ExecusionsRepository.getAll(ns).some(x => x.type === OrderType.SHARE_RAM)) {
        // on ne fait rien
        return;
    }

    const shareRamOrder: Order = {
        type: OrderType.SHARE_RAM
    }
    ExecusionsRepository.add(ns, shareRamOrder);
}