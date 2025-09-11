import * as Log from 'workspace/socle/utils/logging';

export class Dashboard {
    private ns: NS;
    private service: string;
    private role?: string;
    private hostSource?: string;
    private pid?: number;
    public readonly icon?: string;

    constructor(
        ns: NS, 
        service: string, 
        options: {
            role?: string, 
            hostSource?: string, 
            pid?: number, 
            icon?: string
        }
    ) {
        this.ns = ns;
        this.service = service;
        this.role = options.role;
        this.hostSource = options.hostSource;
        this.pid = options.pid;
        this.icon = options.icon;
    }

    /**
     * 
     * @param ns 
     * @param service 
     * @param role 
     * @param hostSource 
     * @param pid 
     * 
     * @remarks Ram cost : 0
     */
    initTailTitle() {
        const iconLabel = this.icon ? ` ${this.icon.toLowerCase()} ` : ''
        const roleLabel = this.role ? ` #${this.role.toLowerCase()}` : ''
        const sourceLabel = this.hostSource ? Log.source(this.hostSource, {colorless: true}) : ''
        
        this.ns.ui.setTailTitle(`${iconLabel}[${this.service}] ${sourceLabel} ${roleLabel}`, this.pid);
    }
}