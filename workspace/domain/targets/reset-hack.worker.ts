import * as TargetsRepository from 'workspace/domain/targets/targets.repository';
import * as Referentiel from 'workspace/referentiel'

export async function main(ns: NS) {
    TargetsRepository.resetHack(ns);
    ns.run(Referentiel.HACKING_DIRECTORY + '/payload/payload.launcher.ts');
}