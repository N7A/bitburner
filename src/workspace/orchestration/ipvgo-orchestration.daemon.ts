import { WaitAndSeeRamDaemon } from 'workspace/socle/wait-and-see.ram.daemon';
import { CMD_DIRECTORY } from 'workspace/common/referentiel';

// TODO: RamResourceExecution + isExecutionUsless meilleur ?
export async function main(ns: NS) {
    const SCRIPT_TO_EXECUTE: string = CMD_DIRECTORY + 'resource-generator/hacknet/ipvgo/play-board.ts';
    // TODO: call piggy bank to add ram des autre scripts
    const ramToHave: number = this.ns.getScriptRam(SCRIPT_TO_EXECUTE, 'home');

    const daemon: WaitAndSeeRamDaemon = new WaitAndSeeRamDaemon(ns, ramToHave);
    
    daemon.setupDashboard();
    
    await daemon.run();
    
    // TODO: add CMD_DIRECTORY + 'resource-generator/hacknet/ipvgo/play-board.ts' to executions
    this.ns.run(SCRIPT_TO_EXECUTE);

    ns.ui.closeTail();
}
