import { ServersService } from "workspace/servers/servers.service";

// TODO: newTarget() to call when worker have new target 
export class HeadHunterAlert {
    private ns: NS;
    private headHunterScriptPath: string;

    constructor(ns: NS, headHunterScriptPath: string) {
        this.ns = ns;
        this.headHunterScriptPath = headHunterScriptPath;
    }

    newTarget() {
        const executableServers = ServersService.getAllExecutable(this.ns);
        let isHeadHunterRunning: boolean = executableServers
            .some(server => this.ns.isRunning(this.headHunterScriptPath, server));

        if (!isHeadHunterRunning) {
            // not auto run head hunter beacause cost RAM
            this.howToCallHeadHunter();
        }
    }

    private howToCallHeadHunter() {
        this.ns.alert(`New target but no headhunter on work !\n\n Please call one there :\n run ${this.headHunterScriptPath};`)
    }
}