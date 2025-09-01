import { ServersService } from 'workspace/servers/servers.service';
import * as Referentiel from 'workspace/referentiel'
import {ExecutionOrder, ExecutionRequest, ScriptRequest} from 'workspace/load-balancer/model/ExecutionServer'
import * as Log from 'workspace/socle/utils/logging';
import { RamResourceExecution } from 'workspace/load-balancer/model/RamResourceExecution';
import { Logger } from 'workspace/socle/Logger';
import { waitEndExecution } from 'workspace/socle/utils/execution';
import { RamPiggyBankService } from 'workspace/piggy-bank/ram-piggy-bank.service';
import { ProcessRequestType } from 'workspace/load-balancer/domain/model/ProcessRequestType';
import { ProcessRequest } from 'workspace/load-balancer/domain/model/ProcessRequest';
import { PiggyBankRepository } from '../piggy-bank/domain/piggy-bank.repository';

export class ExecutionSelector {
    private ns: NS;
    private orders: RamResourceExecution[];
    private logger: Logger;
    private piggyBankRepository: PiggyBankRepository;

    constructor(ns: NS, orders: RamResourceExecution[]) {
        this.ns = ns;
        this.orders = orders;
        this.logger = new Logger(ns);
        this.piggyBankRepository = new PiggyBankRepository(ns);
    }

    async getRepartitions(): Promise<Map<RamResourceExecution, ExecutionOrder[]>> {
        const serversService = new ServersService(this.ns);
        const targetServers: string[] = serversService.getAllExecutable();

        let executions: Map<RamResourceExecution, ExecutionOrder[]> = new Map();
        
        // init ram disponible by server
        let ramByServer: Map<string, number> = new Map(targetServers.map(x => [x, this.availableRam(this.ns, x)]));

        const totalRamDisponible = targetServers.map(x => this.availableRam(this.ns, x)).reduce((a,b) => a+b);
        
        // define repartition to fixed ram executions
        let ramDisponiblePostFixed = totalRamDisponible;
        for(const order of this.orders.filter(x => x.request.request.wantedThreadNumber !== undefined)) {
            this.logger.info(Log.INFO('Order', `${order.getActionLog()}${order.request.id ? ' ' + order.request.id : ''}`));

            const ramAuthorized = await this.getAuthorizedRam(order, totalRamDisponible);
            this.logger.info(Log.INFO('Ram authorisée', this.ns.formatRam(ramAuthorized) + '/' + this.ns.formatRam(totalRamDisponible)));

            ramDisponiblePostFixed -= ramAuthorized
            // recherche de la répartition possible sur les serveurs
            const executionOrders: ExecutionOrder[] = await this.getExecutionRepartition(this.ns, ramByServer, order.request.request, ramAuthorized);
            // TODO: if executionOrders.length <= 0 -> new ram disponible pour les autres
            executions.set(order, executionOrders);
        }

        // define repartition to ram resource executions
        for(const order of this.orders.filter(x => x.request.request.wantedThreadNumber === undefined)) {
            this.logger.info(Log.INFO('Order', `${order.getActionLog()}${order.request.id ? ' ' + order.request.id : ''}`));

            const ramAuthorized = await this.getAuthorizedRam(order, ramDisponiblePostFixed);
            this.logger.info(Log.INFO('Ram authorisée', this.ns.formatRam(ramAuthorized) + '/' + this.ns.formatRam(ramDisponiblePostFixed)));

            // recherche de la répartition possible sur les serveurs
            const executionOrders: ExecutionOrder[] = await this.getExecutionRepartition(this.ns, ramByServer, order.request.request, ramAuthorized);
            // TODO: if executionOrders.length <= 0 -> new ram disponible pour les autres
            executions.set(order, executionOrders);
        }

        return executions;
    }

    private async getAuthorizedRam(order: RamResourceExecution, availableRam: number) {
        const weightType = this.getTypeWeight(order.request.type);
        const weightPerso = this.getPersonalWeight(order.request);

        let ramAuthorized = weightPerso * weightType * availableRam;
        if (order.request.request.wantedThreadNumber) {
            ramAuthorized = Math.min(ramAuthorized, order.request.request.wantedThreadNumber * (await this.getRamNeeded(this.ns, 'home', order.request.request.scripts) ?? 0))
        }
        this.logger.trace(Log.INFO('Weight perso', weightPerso));
        this.logger.trace(Log.INFO('Weight type', weightType));

        return ramAuthorized;
    }

    private getTypeWeight(type: ProcessRequestType) {
        const getWeightByType = (requestType: ProcessRequestType) => (this.piggyBankRepository.get().ramBank.repartitionByType as Map<ProcessRequestType, number>).get(requestType) ?? 1;
        const totalWeightByType = Math.max(Array.from(new Set(this.orders.map(x => x.request.type)))
                .map(x => getWeightByType(x))
                .reduce((a,b) => a+b), 1);
        return getWeightByType(type) / totalWeightByType;
    }

    private getPersonalWeight(request: ProcessRequest) {
        const totalWeight = Math.max(this.orders.filter(x => x.request.type === request.type)
                .map(x => x.request.weight ?? 1)
                .reduce((a,b) => a+b), 1);
        return (request.weight ?? 1) / totalWeight;
    }

    private async getExecutionRepartition(ns: NS, ramByServer: Map<string, number>, executionRequest: ExecutionRequest, ramAuthorized: number): Promise<ExecutionOrder[]> {
        let orders: ExecutionOrder[] = [];

        let ramToUse = ramAuthorized;
        const entries = Array.from(ramByServer.entries())
            // least available ram server first
            .sort((a,b) => a[1] - b[1]);

        const ramNeededByThread = await this.getRamNeeded(ns, 'home', executionRequest.scripts);
        if (ramNeededByThread === undefined) {
            return [];
        }
        const maxThreadWanted = executionRequest.wantedThreadNumber ?? this.getNbPossibleThreads(ramToUse, ramNeededByThread)
        // plus de thread possible avec la ram restante
        if (maxThreadWanted <= 0) {
            return [];
        }
        
        for (const script of executionRequest.scripts) {
            let threadWanted = maxThreadWanted;
            for(const entry of entries) {
                const ramNeededByThread = await this.getRamNeeded(ns, entry[0], [script]);
                if (ramNeededByThread === undefined) {
                    continue;
                }

                const currentAvailableRam: number = entry[1] ?? 0;

                // find possible thread number
                const currentThreadPossible = this.getNbPossibleThreads(currentAvailableRam, ramNeededByThread);

                const orderThreadNumber = Math.min(currentThreadPossible, maxThreadWanted);

                if (orderThreadNumber > 0) {
                    orders.push({
                        sourceHostname: entry[0], 
                        nbThread: orderThreadNumber, 
                        request: script
                    } as ExecutionOrder);


                    const ramUsed: number = orderThreadNumber * ramNeededByThread
                    // maj ram by server
                    ramByServer.set(entry[0], currentAvailableRam - ramUsed);
                    
                    // maj ram needed
                    ramToUse -= ramUsed;
                    // maj ram wanted
                    threadWanted -= orderThreadNumber;

                    // plus de RAM dispo OU tous les threads du scipt sont commandés
                    if (ramToUse <= 0 || threadWanted <= 0) {
                        break;
                    }
                }
            }

            // plus de RAM dispo
            if (ramToUse <= 0) {
                break;
            }
        }

        return orders;
    }

    /**
     * Retourne la quantité de RAM nécessaire pour faire tourner les scripts cibles.
     * 
     * @param ns Bitburner API
     * @param hostname serveur cible
     * @param scripts scripts cibles
     * @returns quantité de RAM nécessaire
     * 
     * @remarks RAM cost: 0.1 GB
     */
    private async getRamNeeded(ns: NS, hostname: string, scripts: ScriptRequest[]): Promise<number|undefined> {
        let result: number = 0;
        for (const script of scripts) {
            if (!this.ns.fileExists(script.scriptsFilepath, hostname)) {
                this.logger.warn(`Script ${script.scriptsFilepath} inexistant sur ${hostname}`);
                const copyPid = this.ns.run(Referentiel.HACKING_DIRECTORY + '/spreading/copy-toolkit.worker.ts', 1, hostname);

                await waitEndExecution(ns, copyPid);
            }

            let ramNeededByThread = this.ns.getScriptRam(script.scriptsFilepath, hostname);
            if (ramNeededByThread <= 0) {
                this.logger.err(`Script ${script.scriptsFilepath} inexistant sur ${hostname}`);
                return undefined
            }
            result += ramNeededByThread;
        }
        return result;
    }

    /**
     * Retourne la quantité de RAM autorisé à être dépensé.
     * 
     * @param ns Bitburner API
     * @param targetHost serveur cible
     * @returns quantité de RAM autorisé
     * 
     * @remarks RAM cost: 0.1 GB
     */
    private availableRam(ns: NS, targetHost: string) {
        return new RamPiggyBankService(ns).getDisponibleRam(targetHost);
    }

    /**
     * Détermine le nombre de thread possible, à partir de la RAM / thread et de la RAM disponible.
     * 
     * @param availableRam RAM disponible
     * @param ramNeededByThread RAM nécessaire par thread
     * @returns nombre de thread possible
     * 
     * @remarks RAM cost: 0 GB
     */
    private getNbPossibleThreads(availableRam: number, ramNeededByThread: number) {
        return Math.floor(availableRam / ramNeededByThread);
    }
}