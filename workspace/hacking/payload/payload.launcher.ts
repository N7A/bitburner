import * as Referentiel from 'workspace/referentiel'
import {ServerData, HackData} from 'workspace/domain/servers/model/ServerData'
import * as Log from 'workspace/frameworks/logging';
import * as ServersRepository from 'workspace/domain/servers/servers.repository';
import * as TargetsRepository from 'workspace/domain/targets/targets.repository';
import { getAvailableServer } from 'workspace/load-balancer/main'
import { execFitRam } from 'workspace/load-balancer/fit-ram.service'
import {ExecutionParameters, ScriptParameters} from 'workspace/load-balancer/model/ExecutionServer'

//#region Constants
export const HACK_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/hack.looper.ts';
export const WEAKEN_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/weaken.looper.ts';
export const GROW_SCRIPT = Referentiel.HACKING_DIRECTORY + '/payload/grow.looper.ts';
//#endregion Constants

/**
 * Hack les cibles données par le unlock.
 */
export async function main(ns: NS) {
    // load targets
    var targets: string[] = Array.from(new Set(TargetsRepository.get(ns).hackTargets));
    for (const target of targets) {
        ns.print(Log.getStartLog());
        ns.print(`START ${Log.action('Payload')} ${Log.target(target)}`);

        // remove from hack targets
        TargetsRepository.removeHack(ns, target);

        //#region Payload

        // free self RAM script and trigger payload
        const scripts = getPayloadScript(ns, target);

        // TODO : check if payload already running
        //ns.getRunningScript(Properties.HACKING_DIRECTORY + '/payload/hack.looper.ts', targetHost)
        //ns.getRunningScript(Properties.HACKING_DIRECTORY + '/payload/hack.looper.ts', 'home', targetHost)
        
        // TODO : split nb thread (plutot que nb RAM) <- pour que le grow et weaken aient la force pour soutenir le hack
        // TODO : dynamique répartition : hack then weaken then grow then weaken then repeate
        // TODO : weaken thread nb >= grow + hack thread nb; grow thread nb >= hack thread nb
        const payloadRam = scripts.map(x => ns.getScriptRam(x, target)).reduce((x, y) => x + y);

        // check RAM availability to priorize
        const execution: ExecutionParameters = getAvailableServer(ns, payloadRam, 1, target);

        let payload: Payload = new HomePayload(ns);
        if (execution.hostname === target) {
            payload = new SelfPayload(ns);
        }

        payload.execute(execution.hostname, target);
        //#endregion Payload

        ns.print(`END ${Log.action('Payload')} ${Log.target(target)}`);
        ns.print(Log.getEndLog());
    }
}

function getPayloadScript(ns:NS, targetHost: string) {
    const scripts = [];

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
    return scripts;
}
interface Payload {
    execute(sourceHost: string, targetHost: string): void;
}

class HomePayload implements Payload {
    private ns:NS;

    constructor(ns:NS) {
        this.ns = ns;
    }
    
    execute(sourceHost: string, targetHost: string): void {
        this.ns.tprint('WARN', ' ', `Payload on self (${targetHost}) impossible`);
        const scripts = getPayloadScript(this.ns, targetHost);
        for (const script of scripts) {
            let pidExec = this.ns.exec(script, sourceHost, 1, targetHost)

            this.ns.tprint(`${targetHost} : ${script} ${pidExec == 0 ? 'KO': 'OK'}`);
        }
    }
}

/**
 * Execute payload on distant
 */
class SelfPayload implements Payload {
    private ns:NS;

    constructor(ns:NS) {
        this.ns = ns;
    }

    execute(sourceHost: string, targetHost: string): void {
        this.ns.tprint('SUCCESS', ' ', `Payload on self (${targetHost}) possible`);
        const scripts = getPayloadScript(this.ns, targetHost);
        // execute payload on distant
        execFitRam(this.ns, [targetHost], scripts.map(x => {
            return {scriptsFilepath: x} as ScriptParameters
        }));
    }
}