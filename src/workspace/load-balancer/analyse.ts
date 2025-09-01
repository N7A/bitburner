/**
 * SI need best time -> Multi-Daemon
 * SINON SI script ram > 3,2 -> Launcher | /!\ les scripts lancés doivent avoir des ns fonctions différentes
 * SINON -> Sequencer
 */
export async function main(ns: NS) {
    
}

function getMinTimeArchitecture() {
    return 'Multi-Daemon';
}

function getMinRamArchitecture(ns: NS, scripts: string[]) {
    const ramByArchitecture: Map<string, number> = new Map();
    ramByArchitecture.set('Sequencer', getSequencerRam(ns, scripts));
    ramByArchitecture.set('Launcher', getLauncherRam(ns, scripts));
    ramByArchitecture.set('Multi-Daemon', getMultiDaemonRam(ns, scripts));
    
    let min: [string, number] = ramByArchitecture.entries().next().value;
    for (const architecture of Array.from(ramByArchitecture.entries())) {
        if ((min[1] as number) > (architecture[1] as number)) {
            min = architecture;
        }
    }

    return min;
}

/**
 * Un main daemon qui appel des scripts via import de leurs functions.
 */
function getSequencerRam(ns: NS, scripts: string[]) {
    return 1.6 + scripts.map(x => ns.getScriptRam(x) ?? 0).reduce((a, b) => a + b) - 1.6 * scripts.length;
}

/**
 * Un main daemon qui appel des scripts via run.
 */
function getLauncherRam(ns: NS, scripts: string[]) {
    return 1.6 + Math.max(...scripts.map(x => ns.getScriptRam(x) ?? 0));
}

/**
 * Chaque script est un daemon.
 */
function getMultiDaemonRam(ns: NS, scripts: string[]) {
    return scripts.map(x => ns.getScriptRam(x) ?? 0).reduce((a, b) => a + b);
}
