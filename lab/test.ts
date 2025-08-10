import { PiggyBankRepository } from "workspace/domain/piggy-bank/piggy-bank.repository";

export async function main(ns: NS) {
    //ns.print(ns.hacknet.maxNumNodes())
    //ns.print(ns.hacknet.numNodes() < ns.hacknet.maxNumNodes())
    //ns.print(ns.getRunningScript())
    //ns.print(ns.ps())
    /*ns.clearPort(1)
    ns.tprint(ns.readPort(1))
    ns.alert('test \n 1')*/
    ns.tprint(JSON.stringify(ns.getServer('home')));
    ns.tprint(JSON.stringify(ns.getServer('f1rst')));
}