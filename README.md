<p align="center">
  <img alt="Logo Bitburner" src="https://cdn2.steamgriddb.com/icon/f72b5935d3c9a1dbc4dc2cb5bd078cd8/32/256x256.png" />
</p>

Bitburner est un jeu incrémentiel basé sur la programmation. Écrivez des scripts en JavaScript pour automatiser le gameplay, acquérir des compétences, jouer des mini-jeux, résoudre des énigmes, et plus encore dans ce RPG cyberpunk incrémentiel.

Le jeu peut être joué sur https://danielyxie.github.io/bitburner ou installé via [Steam](https://store.steampowered.com/app/1812820/Bitburner/).

---

Ce dépôt contient les scripts que j'utilise pour jouer dans Bitburner.

> [!WARNING]
> Peut contenir des spoilers

---

# ⚙️ Stack technique

[![Badge Bitburner v2.8.1](https://img.shields.io/badge/Bitburner-v2.8.1-blue)](https://store.steampowered.com/news/app/1812820?updates=true&emclan=103582791471085708&emgid=529842974219043322)

[![Badge TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[![Badge JSON](https://img.shields.io/badge/-JSON-000000?style=for-the-badge&logo=json&logoColor=white)](https://www.json.org/json-fr.html)

# 🚀 Déployement

1. cloner le repository
2. Générer le fichier manifest
```bash
npm install
npm run build
```
3. Push le fichier manifest généré
4. Aller dans le terminal du jeu
5. Récupérer le script qui pull le repository
```bash
wget https://raw.githubusercontent.com/N7A/bitburner/refs/heads/main/src/workspace/synchronize/init-pull.ts /workspace/synchronize/init-pull.ts
```
6. Executer le script
```bash
run /workspace/synchronize/init.pull.ts
```

## 🔄 Refresh pull

```bash
run /workspace/synchronize/pull.launcher.ts
```

# ▶️ Run

```bash
run /workspace/new-start/main.ts
```
