export type PortProgram = {
    property: string;
    filename: string;
    program: (host: string) => boolean;
}


export function getPortPrograms(ns: NS) {
    /**
     * Hard-coded list of programs that can open ports and server object properties for those respective ports.
     */
    const PORT_PROGRAMS: PortProgram[] = [
        {property: `sshPortOpen`, filename: `BruteSSH.exe`, program: ns.brutessh},
        {property: `ftpPortOpen`, filename: `FTPCrack.exe`, program: ns.ftpcrack},
        {property: `smtpPortOpen`, filename: `relaySMTP.exe`, program: ns.relaysmtp},
        {property: `httpPortOpen`, filename: `HTTPWorm.exe`, program: ns.httpworm},
        {property: `sqlPortOpen`, filename: `SQLInject.exe`, program: ns.sqlinject},
    ];

    return PORT_PROGRAMS;
}
