export type ServerData = {
    name: string;
    parent?: string;
    depth?: number;
    state: ServerState;
    unlockRequirements: UnlockRequirements;
    hackData: HackData;
}

export type ServerState = {
    unlocked?: boolean;
    scanned?: boolean;
}

export type UnlockRequirements = {
    /** Number of open ports required in order to gain admin/root access */
    numOpenPortsRequired?: number;
    /** Hacking level required to hack this server */
    requiredHackingSkill?: number;
}

export type HackData = {
    /** Minimum server security level that this server can be weakened to */
    minDifficulty?: number;
    /** Maximum amount of money that this server can hold */
    moneyMax?: number;
    /** RAM (GB) available on this server */
    maxRam: number;
    /** How many CPU cores this server has. Affects magnitude of grow and weaken ran from this server. */
    cpuCores: number;
}
