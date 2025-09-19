export class Broker {
    static async pushData(ns: NS, port: number, data: any, handlerScript?: string) {
        while(!ns.tryWritePort(port, data)) {
            await ns.asleep(250);
        }
    
        if (handlerScript) {
            ns.exec(handlerScript, 'home', {preventDuplicates: true});
        }
    }
    
    static async getResponse(ns: NS, port: number): Promise<any> {
        if (ns.peek(port) === 'NULL PORT DATA') {
            await ns.nextPortWrite(port);
        }

        return ns.readPort(port);
    }

    static async peekResponse(ns: NS, port: number): Promise<any> {
        if (ns.peek(port) === 'NULL PORT DATA') {
            await ns.nextPortWrite(port);
        }

        return ns.peek(port);
    }

    static async getAllResponses(ns: NS, port: number): Promise<any> {
        if (ns.peek(port) === 'NULL PORT DATA') {
            await ns.nextPortWrite(port);
        }

        let responses: any[] = [];
        while(ns.peek(port) !== 'NULL PORT DATA') {
            responses.push(ns.readPort(port));
        }
        
        return responses;
    }
    
}
    