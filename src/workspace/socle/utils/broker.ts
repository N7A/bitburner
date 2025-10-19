export class Broker {
    private static readonly NO_DATA = 'NULL PORT DATA';

    static async pushData(ns: NS, port: number, data: any, handlerScript?: string) {
        while(!ns.tryWritePort(port, data)) {
            await ns.asleep(250);
        }
    
        if (handlerScript) {
            ns.exec(handlerScript, 'home', {preventDuplicates: true});
        }
    }
    
    static async waitEmptyPort(ns: NS, port: number): Promise<any> {
        while(ns.peek(port) !== Broker.NO_DATA) {
            ns.asleep(250);
        }
    }
    
    static async waitNewData(ns: NS, port: number): Promise<any> {
        if (ns.peek(port) === Broker.NO_DATA) {
            await ns.nextPortWrite(port);
        }
    }

    static async getResponse(ns: NS, port: number): Promise<any> {
        await Broker.waitNewData(ns, port);

        return ns.readPort(port);
    }

    static async peekResponse(ns: NS, port: number): Promise<any> {
        await Broker.waitNewData(ns, port);

        return ns.peek(port);
    }

    static async getAllResponses(ns: NS, port: number): Promise<any[]> {
        await Broker.waitNewData(ns, port);

        let responses: any[] = [];
        while(ns.peek(port) !== Broker.NO_DATA) {
            responses.push(ns.readPort(port));
        }
        
        return responses;
    }
    
}
    