import { main as openPorts } from 'workspace/hacking/unlock/open-ports.worker'
import * as Log from 'workspace/frameworks/logging';
import { ServerData, UnlockRequirements } from 'workspace/domain/servers/model/ServerData'
import * as ServersRepository from 'workspace/domain/servers/servers.repository'
import * as TargetsRepository from 'workspace/domain/targets/targets.repository'
import { main as copyToolkit } from 'workspace/hacking/spreading/copy-toolkit.launcher'

export async function main(ns: NS, targetHost: string) {
    // load input arguments
    const input: InputArg = getInput(ns, targetHost);

    var nuked: boolean = false
    let resultMessage: string;

    ns.atExit(async() => {
        if (nuked) {
            ns.tprint('SUCCESS', ' ', `${input.hostnameTarget} [nuked]`, resultMessage ? ` : ${resultMessage}` : '');
            await handleUnlock(ns, input.hostnameTarget);
        } else {
            ns.print('WARN', ' ', `${input.hostnameTarget} nuke ${Log.color('KO', Log.Color.RED)}`, resultMessage ? ` : ${resultMessage}` : '');
        }
    });


    // load host data
    const data: ServerData | null = ServersRepository.get(ns, input.hostnameTarget);
    const requirements: UnlockRequirements = data!.unlockRequirements

    if (ns.hasRootAccess(data!.name)) {
        nuked = true
        resultMessage = `Nuke already OK`;
        ns.exit();
    }

    ns.print('INFO', ' ', 'Pas d\'access root');

    // vérification des requirements pour avoir accès au root
    // vérification du hacking level
    const missedLevels: number = missedHackingLevels(ns, requirements.requiredHackingSkill as number);
    if (missedLevels > 0) {
        resultMessage = `More hacking level needed (${Log.color(`${missedLevels}`, Log.Color.CYAN)})`;
        ns.exit();
    }

    // attendre l'ouverture des ports
    var isPortOpened = await openPorts(ns, data!.name)

    // prevent nuke if openPorts ko
    if (!isPortOpened) {
        resultMessage = `Open ports impossible pour le moment`;
        ns.exit();
    }
    ns.tprint('SUCCESS', ' ', `${input.hostnameTarget} [ports opened]`);

    // ouvrir l'accès au root
    nuked = ns.nuke(input.hostnameTarget);
}

//#region Input arguments
type InputArg = {
    /** Serveur cible */
    hostnameTarget: string;
}

/**
 * Load input arguments
 * @param ns Bitburner API
 * @returns 
 */
function getInput(ns: NS, hostnameTarget: string): InputArg {
    let result: InputArg = {
        hostnameTarget: (ns.args[0] ?? hostnameTarget ?? ns.getHostname()) as string
    };

    return result;
}
//#endregion Input arguments

/**
 * Nombre de hacking level nécessaire pour effectuer le nuke.
 */
function missedHackingLevels(ns: NS, requiredHackingLevel: number): number {
    const hackingLevel: number = ns.getHackingLevel();
    return Math.max(requiredHackingLevel - hackingLevel, 0)
}


/**
 * Enregistre en base le fait qu'on ai débloqué la cible ainsi que les nouvelles cibles accessibles.
 */
function saveUnlocked(ns: NS, targetUnlocked: string) {
    ServersRepository.handleUnlock(ns, targetUnlocked);

    // remove from unlock targets
    TargetsRepository.removeUnlock(ns, targetUnlocked);

    // add to hack targets
    TargetsRepository.addHack(ns, targetUnlocked);
    
    // add to hackable targets
    TargetsRepository.addHackable(ns, targetUnlocked);
}

async function handleUnlock(ns: NS, targetUnlocked: string) {
    ns.tprint('SUCCESS', ' ', `${targetUnlocked} [unlocked]`);
    
    saveUnlocked(ns, targetUnlocked);

    //#region Spreading
    ns.print('Spreading ', targetUnlocked);
    // copie du toolkit
    await copyToolkit(ns, targetUnlocked);
    //#endregion Spreading
}