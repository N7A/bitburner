import * as Referentiel from 'workspace/referentiel'
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import {ServerData, HackData} from 'workspace/domain/servers/model/ServerData'
import * as ServersRepository from 'workspace/domain/servers/servers.repository';

//#region Constants
export const HACK_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/hack.looper.ts';
export const WEAKEN_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/weaken.looper.ts';
export const GROW_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/grow.looper.ts';
//#endregion Constants

export class PayloadExecution implements RamResourceExecution {
    private scripts: string[];

    constructor(ns: NS, targetHost: string) {
        const scripts: string[] = [];
    
        // load host data
        const data: ServerData|null = ServersRepository.get(ns, targetHost);
        const hackData: HackData = data!.hackData;
    
        scripts.push(HACK_SCRIPT);
        scripts.push(WEAKEN_SCRIPT);
    
        if (hackData.moneyMax === 0) {
            ns.tprint('WARN', ' ', '[', targetHost, '] ', 'No money in there');
        } else {
            scripts.push(GROW_SCRIPT);
            scripts.push(WEAKEN_SCRIPT);
        }

        this.scripts = scripts;
    }

    getScript() {
        return this.scripts;
    }

    isExecutionUsless(ns: NS): boolean {
        return false;
    }
}