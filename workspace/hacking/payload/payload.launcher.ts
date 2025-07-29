import * as Referentiel from 'workspace/referentiel'
import {Targets} from 'workspace/hacking/model/Targets'
import {TargetHost, HackData} from 'workspace/hacking/model/TargetHost'
import * as Log from 'workspace/logging-framework/main'
import * as ServersRepository from 'workspace/domain/servers/servers.repository';
import * as TargetsRepository from 'workspace/domain/targets/targets.repository';
import { getAvailableServer } from 'workspace/load-balancer/main'
import { execFitRam } from 'workspace/load-balancer/fit-ram.service'
import {ExecutionParameters, ScriptParameters} from 'workspace/load-balancer/model/ExecutionServer'

/**
 * Hack les cibles données par le unlock.
 */
export async function main(ns: NS) {
    ns.print(Log.getStartLog())
    // load targets
    var targets: Targets = TargetsRepository.get(ns);
    for (const target of Array.from(new Set(targets.hackTargets))) {
        // remove from hack targets
        TargetsRepository.removeHack(ns, target);

        // load host data
        var data: TargetHost|null = ServersRepository.get(ns, target);

        //#region Payload
        ns.print('START [Payload] ', data!.name)

        // TODO : check if payload already running
        //ns.getRunningScript(Properties.HACKING_DIRECTORY + '/payload/hack.looper.ts', targetHost)
        //ns.getRunningScript(Properties.HACKING_DIRECTORY + '/payload/hack.looper.ts', 'home', targetHost)

        //ns.run(Referentiel.HACKING_DIRECTORY + '/payload/setup-server.worker.ts', 1, data.name);
        
        // free self RAM script and trigger payload
        const pidPayload = getPayloadScriptname(ns, data!.name);
        //#endregion Payload
        
        /*// attendre payload setup
        while (pidPayload != 0 && ns.isRunning(pidPayload)) {
            await ns.asleep(500)
        }*/
        ns.print('END [Payload] ', data!.name)
    }
    
    ns.print(Log.getEndLog())
}

function getPayloadScriptname(ns: NS, targetHost: string) {
    const scripts = [];

    // load host data
    const data: TargetHost|null = ServersRepository.get(ns, targetHost);
    const hackData: HackData = data!.hackData;

    if (hackData.moneyMax === 0) {
        ns.tprint('WARN', ' ', '[', targetHost, '] ', 'No money in there');
    } else {
        scripts.push(Referentiel.HACKING_DIRECTORY + '/payload/grow.looper.ts');
        scripts.push(Referentiel.HACKING_DIRECTORY + '/payload/weaken.looper.ts');
    }
    scripts.push(Referentiel.HACKING_DIRECTORY + '/payload/hack.looper.ts');
    scripts.push(Referentiel.HACKING_DIRECTORY + '/payload/weaken.looper.ts');
    
    // TODO : split nb thread (plutot que nb RAM) <- pour que le grow et weaken et la force pour soutenir le hack
    // TODO : dynamique répartition : hack then weaken then grow then weaken then repeate
    // TODO : weaken thread nb >= grow + hack thread nb; grow thread nb >= hack thread nb
    const payloadRam = scripts.map(x => ns.getScriptRam(x, targetHost)).reduce((x, y) => x + y);

    // check RAM availability to priorize
    const execution: ExecutionParameters = getAvailableServer(ns, payloadRam, 1, targetHost);
    if (execution.hostname === targetHost) {
        ns.tprint('SUCCESS', ' ', `Payload on self (${targetHost}) possible`);
        // execute payload on distant
        execFitRam(ns, [targetHost], scripts.map(x => {
            return {scriptsFilepath: x} as ScriptParameters
        }));
        return;
    }

    ns.tprint('WARN', ' ', `Payload on self (${targetHost}) impossible`)
    for (const script of scripts) {
        let pidExec = ns.exec(script, execution.hostname, 1, targetHost)

        ns.tprint(`${targetHost} : ${script} ${pidExec == 0 ? 'KO': 'OK'}`);
    }
}