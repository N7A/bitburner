export class MemberNamesRepository {
    /**
     * Remise à zéro de la base de données.
     * 
     * @param ns Bitburner API
     * 
     * @remarks Ram cost : 0 GB
     */
    static reset(): void {
        const names: string[][] = [
            // Breaking Bad
            ['Jesse Pinkman', 'Walter White', 'Saul Goodman'],
            // Peaky Blinder
            ['Thomas Shelby'],
            ['Bonnie', 'Clyde'],
            ['Joe Dalton', 'Jack Dalton', 'William Dalton', 'Averell Dalton', 'Ma Dalton'],
            ['Le Bon', 'La Brute', 'Le Truand']
            // les 7 mercenaires

        ]
    }
}