export type UnlockRequirements = {
    /** Number of open ports required in order to gain admin/root access */
    numOpenPortsRequired?: number;
    /** Hacking level required to hack this server */
    requiredHackingSkill?: number;
}