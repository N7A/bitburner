
export class Rank {
    static STAGIAIRE = new Rank('Larbin', '🔰');
    static JUNIOR = new Rank('Junior', '🎓');
    static CONFIRME = new Rank('Confirmé', '✅');
    static SENIOR = new Rank('Senior', '🎖️');
    static EXPERT = new Rank('Expert', '👑');

    name: string;
    icon: string;

  constructor(name: string, icon: string) {
    this.name = name;
    this.icon = icon;
  }
}