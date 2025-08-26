# Configuration applicative

La configuration d'application a été mis sous forme de fichier JSON.
Par rapport à un fichier ts exportant des constantes, cela permet un rechargement à chaud et également de modifier les valeurs via un script.

- GangDirectiveRepository
- PiggyBankRepository

# Package cmd vs workspace

Le package workspace contient toutes les classes et model utilisable par les scripts.

Le package cmd contient tous les scripts avec un main, pouvant être démarré depuis le terminal.

Le but de cette séparation est d'améliorer l'affichage de l'auto-complétion lors d'une execution via le terminal.