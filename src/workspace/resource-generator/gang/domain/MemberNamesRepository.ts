import { JsonRepository } from "workspace/socle/interface/json-repository";
import * as Referentiel from 'workspace/referentiel'

export class MemberNamesRepository extends JsonRepository<string[]> {
    
    constructor(ns: NS) {
        super(ns)
        this.REPOSITORY = Referentiel.GANG_MEMBER_NAMES_REPOSITORY;
    }
    
    /**
     * Remise à zéro de la base de données.
     * 
     * @param ns Bitburner API
     * 
     * @remarks Ram cost : 0 GB
     */
    reset(): void {
        const names: string[][] = [
            // Breaking Bad
            ['Jesse Pinkman', 'Walter White', 'Saul Goodman'],
            // Peaky Blinder
            ['Thomas Shelby'],
            ['Bonnie', 'Clyde'],
            ['Joe Dalton', 'Jack Dalton', 'William Dalton', 'Averell Dalton', 'Ma Dalton'],
            ['Le Bon', 'La Brute', 'Le Truand'],
            // les 7 mercenaires
            ['Kanbei Shimada', 'Kikuchiyo', 'Gorobei Katayama', 'Kyuzō', 'Heihachi Hayashida', 'Shichiroji', 'Katsushiro Okamoto']
        ]
        this.resetWith(names);
    }
    
    /**
     * Supprime un nom de la base de données.
     * 
     * @param ns Bitburner API
     * @param executionToRemove execution à supprimer
     * 
     * @remarks Ram cost : 0.1 GB
     */
    remove(groupIndex: number, nameIndex: number) {
        // get last version of executions
        let names: string[][] = this.getAll();

        const countLine = 1
        // remove execution
        names[groupIndex] = names[groupIndex].splice(nameIndex, countLine);
        this.ns.print(`Removed lines ${countLine}`)

        // save data
        this.resetWith(names);
    }
}