export class Broker {
    static async pushData(ns: NS, port: number, data: any, handlerScript: string) {
        while(!ns.tryWritePort(port, data)) {
            await ns.asleep(500);
        }
    
        ns.exec(handlerScript, 'home', {preventDuplicates: true});
    }
    
    static async getResponse(ns: NS, port: number): Promise<any> {
        if (ns.peek(port) === 'NULL PORT DATA') {
            await ns.nextPortWrite(port);
        }

        return ns.readPort(port);
    }
}
    