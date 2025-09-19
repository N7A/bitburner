import {Interval} from 'workspace/resource-generator/coding-contract/model/Interval';
import { CodingContractResolver } from 'workspace/socle/interface/coding-contract-resolver';
import * as Log from 'workspace/socle/utils/logging';

export async function main(ns: NS) {
    const resolver: MergeOverlappingIntervalsResolver = new MergeOverlappingIntervalsResolver(ns);
    
    await resolver.run();
}

class MergeOverlappingIntervalsResolver extends CodingContractResolver {
    constructor(ns: NS) {
        super(
            ns, 
            [
                ns.enums.CodingContractName.MergeOverlappingIntervals
            ]
        );
    }

    protected getSolution(codingContract: CodingContractObject) {
        return this.getSolutionI(codingContract);
    }
    
    private getSolutionI(contract: CodingContractObject): number[][] {
        let result: Interval[] = [];

        const data: number[][] = contract.data as number[][];
        this.logger.trace(Log.INFO('Données', data));
        
        for (const item of data) {
            const newInterval: Interval = {basse: item[0], haute: item[1]};
            result = this.integrate(result, newInterval);
        }
            
        return result
            // tri par intervale basse
            .sort((a, b) => a.basse - b.basse)
            .map(x => [x.basse, x.haute]);
    }

    private integrate(intervals: Interval[], newInterval: Interval) {
        for (const interval of intervals) {
            if (interval.haute >= newInterval.basse && newInterval.haute >= interval.basse) {
                intervals.splice(intervals.indexOf(interval), 1)
                return this.integrate(
                    intervals, 
                    {
                        basse: Math.min(interval.basse, newInterval.basse), 
                        haute: Math.max(interval.haute, newInterval.haute)
                    }
                )
            }
        }

        intervals.push(newInterval);
        return intervals;
    }
}
