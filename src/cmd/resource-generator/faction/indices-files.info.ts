import * as Log from 'workspace/socle/utils/logging';
import { ServersService } from 'workspace/servers/servers.service';
import { Logger } from 'workspace/socle/Logger';
import { Info } from 'workspace/socle/interface/info';

export async function main(ns: NS) {
    const info: IndicesInfo = new IndicesInfo(ns);

    info.run();
}

class IndicesInfo extends Info {
    private logger: Logger;
    private serversService: ServersService;

    constructor(ns: NS) {
        super(ns, 'Faction indices');
        this.serversService = new ServersService(ns);

        this.logger = new Logger(ns);
        this.setupDashboard();
    }

    printData() {
        const servers = this.serversService.getAllHackable();
        for (const server of servers) {
            const indices = this.getIndices(server);
            
            if (indices.length > 0) {
                this.showIndices(server, indices);
            }
        }
    }

    getIndices(server: string) {
        return this.ns.ls(server)
            .filter(x => !x.startsWith('repositories') 
                && !x.startsWith('workspace') 
                && !x.startsWith('cmd') 
                && !x.endsWith('.cct'));
    }
    
    showIndices(server: string, indices: string[]) {
        this.logger.log(Log.title(server))
        indices.forEach(x =>  this.logger.log(x));
        this.ns.scp(indices, 'home', server);
        this.ns.tprint('\n')
    }
}