import { ServersService } from "workspace/servers/servers.service";

// TODO: newTarget() to call when worker have new target
export class HeadHunterAlert {
    private ns: NS;
    private headHunterScriptPath: string;
    private serversService: ServersService;

    constructor(ns: NS, headHunterScriptPath: string) {
        this.ns = ns;
        this.headHunterScriptPath = headHunterScriptPath;
        this.serversService = new ServersService(ns);
    }

    /**
     * A executer lors de la découverte de nouvelle cibles.
     * 
     * @remarks RAM cost: 0.1 GB
     */
    newTarget() {
        const executableServers = this.serversService.getAllExecutable();
        let isHeadHunterRunning: boolean = executableServers
            .some(server => this.ns.isRunning(this.headHunterScriptPath, server));

        if (!isHeadHunterRunning) {
            // not auto run head hunter beacause cost RAM
            this.howToCallHeadHunter();
        }
    }

    /**
     * Affiche comment démarrer le headhunter lié au nouvelles targets.
     * 
     * @remarks RAM cost: 0 GB
     */
    private howToCallHeadHunter() {
        this.ns.alert(`New target but no headhunter on work !\n\n Please call one there :\n run ${this.headHunterScriptPath};`)
    }
}