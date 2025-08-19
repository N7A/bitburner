import { ServersRepository } from "workspace/servers/domain/servers.repository";

export async function main(ns: NS) {
    //ns.print(ns.hacknet.maxNumNodes())
    //ns.print(ns.hacknet.numNodes() < ns.hacknet.maxNumNodes())
    //ns.print(ns.getRunningScript())
    //ns.print(ns.ps())
    /*ns.clearPort(1)
    ns.tprint(ns.readPort(1))
    ns.alert('test \n 1')*/
    //ns.tprint(JSON.stringify(ns.getServer('home')));
    //ns.tprint(JSON.stringify(ns.getServer('f1rst')));
    
    ServersRepository.add(ns, 'f1rst');
}