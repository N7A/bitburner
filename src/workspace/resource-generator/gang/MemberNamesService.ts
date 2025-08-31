import { MemberNamesRepository } from "workspace/resource-generator/gang/domain/MemberNamesRepository";

export class MemberNamesService {
    private repository: MemberNamesRepository;

    constructor(ns: NS) {
        this.repository = new MemberNamesRepository(ns)
    }

    getNextName(): string {
        const names: string[][] = this.repository.getAll()
            .filter(x => x.length > 0);
        const groupMax = names.length -1;
        const groupMin = 0;
        const groupIndex = Math.round(Math.random() * (groupMax - groupMin) + groupMin);

        const nameMax = names[groupIndex].length -1;
        const nameMin = 0;
        const nameIndex = Math.round(Math.random() * (nameMax - nameMin) + nameMin);

        this.repository.remove(groupIndex, nameIndex);
        return names[groupIndex][nameIndex];
    }
}