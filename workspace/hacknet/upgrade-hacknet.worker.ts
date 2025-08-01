import { getUpgrade } from 'workspace/hacknet/upgrade-hacknet.target-selector'
import { UpgradeExecution } from 'workspace/hacknet/model/UpgradeExecution'
import { UpgradeType } from 'workspace/hacknet/model/UpgradeType'

/**
 * @remarks Import RAM : 4GB
 */
export function executeUpgrade(ns: NS, selectedUpgrade: UpgradeExecution | undefined) {
    if (selectedUpgrade === undefined || selectedUpgrade.ratio <= 0) {
        return false;
    }

    // execute the most profitability upgrade
    let toastType: ToastVariant = ns.enums.ToastVariant.ERROR
    const toastDuration: number = 5000;
    if (selectedUpgrade?.upgradeType === UpgradeType.NODE) {
        const result: number = ns.hacknet.purchaseNode();
        
        if (result >= 0) {
            toastType = ns.enums.ToastVariant.SUCCESS
        }
        ns.toast(`Achat d'une nouvelle node (${result})`, toastType, toastDuration);
    } else {
        const result: boolean = getUpgrade(ns, selectedUpgrade.upgradeType)?.executeFunction(selectedUpgrade?.index as number, selectedUpgrade?.quantite) ?? false;
        
        if (result) {
            toastType = ns.enums.ToastVariant.SUCCESS
        }
        ns.toast(`Upgrade [${selectedUpgrade?.upgradeType}] de la node ${selectedUpgrade?.index} (x${selectedUpgrade?.quantite})`, toastType, toastDuration);
    }

    return true;
}
