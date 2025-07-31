import {ExecutionParameters, ScriptParameters} from 'workspace/load-balancer/model/ExecutionServer'
import * as Properties from 'workspace/load-balancer/application-properties'
import * as Log from 'workspace/frameworks/logging';
import * as OwnedServersRepository from 'workspace/domain/owned-servers.repository'
import * as Referentiel from 'workspace/referentiel'

export async function execFitRam(ns: NS, hostnames: string[], scripts: ScriptParameters[], threadNeeded?: number): Promise<boolean> {
    let threadLaunched: number = 0;
    for (const server of hostnames) {
        // recherche du nombre de thread possible sur le serveur
        const execution: ExecutionParameters = await getExecutionPossible(ns, server, scripts);

        // ajustement du nombre de thread en fonction du nombre demandé en entrée
        if (threadNeeded !== undefined) {
            execution.nbThread = Math.min(execution.nbThread, threadNeeded);
        }

        // lancement des scripts
        const executeResult = await execute(ns, execution);
        if (executeResult === true) {
            threadLaunched += execution.nbThread;
            if (threadNeeded !== undefined) {
                threadNeeded -= execution.nbThread;
                // ajustement du nombre de thread nécessaire
                if (threadNeeded <= 0 ) {
                    break;
                }
            }
        }
    }
    ns.tprint(`Total thread launched (${ns.formatNumber(threadLaunched, 0)})`);
    return (threadNeeded === undefined && threadLaunched > 0) 
        || (threadNeeded !== undefined && threadNeeded <= 0);
}

async function getExecutionPossible(ns: NS, hostname: string, scripts: ScriptParameters[]): Promise<ExecutionParameters> {
    let result: ExecutionParameters = {hostname: hostname, nbThread: 0, scripts: scripts}
    const currentAvailableRam: number = availableRam(ns, hostname);
    ns.tprint(`[${hostname}]`, ' ', Log.INFO('Available RAM', ns.formatRam(currentAvailableRam)));
    // find possible thread number        
    const ramNeededByThread = await getRamNeeded(ns, hostname, scripts);
    if (ramNeededByThread === undefined) {
        return result;
    }
    let possibleThread = getNbPossibleThreads(currentAvailableRam, ramNeededByThread);
    result.nbThread = possibleThread;
    return result;
}

async function execute(ns: NS, execution: ExecutionParameters): Promise<boolean> {
    if (execution.nbThread === 0) {
        return true;
    }

    for (const script of execution.scripts) {
        if (!ns.fileExists(script.scriptsFilepath, execution.hostname)) {
            ns.tprint('WARN', ' ', `Script ${script.scriptsFilepath} inexistant sur ${execution.hostname}`);
            const copyPid = ns.run(Referentiel.HACKING_DIRECTORY + '/spreading/copy-toolkit.worker.ts', 1, execution.hostname);
            while(copyPid != 0 && ns.isRunning(copyPid)) {
                await ns.asleep(500);
            }
        }

        ns.tprint("INFO", " ", `${Log.color(ns.formatNumber(execution.nbThread, 0), Log.Color.CYAN)} threads of ${script.scriptsFilepath} can be runned from ${Log.color(execution.hostname, Log.Color.CYAN)}`);

        const executionPid: number = ns.exec(script.scriptsFilepath, execution.hostname, execution.nbThread, ...script.args ?? []);

        if (executionPid === 0) {
            return false;
        }

        ns.tprint("SUCCESS", " ", `Starting ${Log.color(ns.formatNumber(execution.nbThread, 0), Log.Color.CYAN)} threads of ${script.scriptsFilepath} from ${Log.color(execution.hostname, Log.Color.CYAN)}`);
    }

    return true;
}

async function getRamNeeded(ns: NS, hostname: string, scripts: ScriptParameters[]): Promise<number|undefined> {
    let result: number = 0;
    for (const script of scripts) {
        if (!ns.fileExists(script.scriptsFilepath, hostname)) {
            ns.tprint('WARN', ' ', `Script ${script.scriptsFilepath} inexistant sur ${hostname}`);
            const copyPid = ns.run(Referentiel.HACKING_DIRECTORY + '/spreading/copy-toolkit.worker.ts', 1, hostname);
            while(copyPid != 0 && ns.isRunning(copyPid)) {
                await ns.asleep(500);
            }
        }

        let ramNeededByThread = ns.getScriptRam(script.scriptsFilepath, hostname);
        if (ramNeededByThread <= 0) {
            ns.tprint('ERROR', ' ', `Script ${script.scriptsFilepath} inexistant sur ${hostname}`);
            return undefined
        }
        result += ramNeededByThread;
    }
    return result;
}

function getAllLoopExecution(ns: NS, hostname: string): ScriptParameters[] {
    const process: ProcessInfo[] = ns.ps(hostname).filter(x => x.filename.endsWith('.looper.ts'));
    return process.map(x => {
        return {
            scriptsFilepath: x.filename,
            args: x.args,
            pid: x.pid
        } as ScriptParameters
    })
}

export async function execFitRamLoop(ns: NS, scripts: ScriptParameters[]) {
    const availableServers = OwnedServersRepository.getAll(ns).map(x => x.hostname);

    for (const targetHost of availableServers) {        
        // load executions data
        let executionsToRefresh: ScriptParameters[] = getAllLoopExecution(ns, targetHost);
        
        // kill all current executions
        for (const executionToRefresh of executionsToRefresh) {
            if (executionToRefresh.pid !== 0) {
                ns.kill(executionToRefresh.pid);
            }
        }

        execFitRam(ns, [targetHost], [...scripts, ...executionsToRefresh])
    }
}

function getNbPossibleThreads(availiableRam: number, ramNeededByThread: number) {
    return Math.floor(availiableRam / ramNeededByThread);
}

function availableRam(ns: NS, targetHost: string) {
    return ns.getServerMaxRam(targetHost) - (Properties.ramReserve.get(targetHost) ?? 0) - ns.getServerUsedRam(targetHost);
}