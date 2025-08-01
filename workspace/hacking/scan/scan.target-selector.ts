import {Targets} from 'workspace/domain/targets/model/Targets'
import * as TargetsRepository from 'workspace/domain/targets/targets.repository'

export function getScanTarget(ns: NS): string[] {
    // load targets
    const targets: Targets = TargetsRepository.get(ns);
    return Array.from(new Set(targets.scanTargets));
}