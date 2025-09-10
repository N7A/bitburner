# Configuration applicative

La configuration d'application a été mis sous forme de fichier JSON.
Par rapport à un fichier ts exportant des constantes, cela permet un rechargement à chaud et également de modifier les valeurs via un script.

- GangDirectiveRepository
- PiggyBankRepository

# Package cmd vs workspace

Le package workspace contient toutes les classes et model utilisable par les scripts.

Le package cmd contient tous les scripts avec un main, pouvant être démarré depuis le terminal.

Le but de cette séparation est d'améliorer l'affichage de l'auto-complétion lors d'une execution via le terminal.

# Repositories

Les bases de données sont sous la forme de json, le type de fichier le plus structuré autorisé par le jeu.

## SGBD

Pour mettre à jour une base de donnée on passe par un service.
Pour prendre en compte les requêtes de mise à jour on utilise sgbd.handler.
Le service va alimenter la queue d'un port, puis le sgbd.handler va dépiler cette queue et executer les requêtes de modification e la BDD.

Cette architecture est nécessaire pour que les différents serveurs aient accès à une base de donnée unique, la lecture de fichier ne pouvant être fait que sur son propre serveur.

Cela a l'avantage d'assurer que les requêtes soient prisent en compte malgré le crash d'un script, le contenu de la queue ne disparaissant qu'au redémarrage du jeu (Durabilité).

On reduit également la RAM sur les différents script, la RAM des repositories étant seulement présent sur l'unique thread de sgbd.handler.
