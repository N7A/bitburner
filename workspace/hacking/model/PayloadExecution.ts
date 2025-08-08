import * as Referentiel from 'workspace/referentiel'
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import {ServerData, HackData} from 'workspace/domain/servers/model/ServerData'
import { ServersRepository } from 'workspace/domain/servers/servers.repository';

//#region Constants
export const HACK_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/hack.looper.ts';
export const WEAKEN_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/weaken.looper.ts';
export const GROW_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/grow.looper.ts';
//#endregion Constants

export class PayloadExecution implements RamResourceExecution {
    private scripts: string[];
    private targetHost: string;

    constructor(ns: NS, targetHost: string) {
        const scripts: string[] = [];
        this.targetHost = targetHost
    
        // load host data
        const data: ServerData|null = ServersRepository.get(ns, this.targetHost);
        const hackData: HackData = data!.hackData;
    
        scripts.push(HACK_SCRIPT);
        scripts.push(WEAKEN_SCRIPT);
    
        if (hackData.moneyMax === 0) {
            ns.print('WARN', ' ', '[', this.targetHost, '] ', 'No money in there');
        } else {
            scripts.push(GROW_SCRIPT);
            scripts.push(WEAKEN_SCRIPT);
        }

        this.scripts = scripts;
    }

    getScript() {
        // TODO : check if payload already running
        //ns.getRunningScript(Properties.HACKING_DIRECTORY + '/payload/hack.looper.ts', targetHost)
        //ns.getRunningScript(Properties.HACKING_DIRECTORY + '/payload/hack.looper.ts', 'home', targetHost)
        
        // TODO : split nb thread (plutot que nb RAM) <- pour que le grow et weaken aient la force pour soutenir le hack
        // TODO : dynamique répartition : hack then weaken then grow then weaken then repeate
        // TODO : weaken thread nb >= grow + hack thread nb; grow thread nb >= hack thread nb
        return this.scripts;
    }

    isExecutionUsless(ns: NS): boolean {
        return false;
    }
}