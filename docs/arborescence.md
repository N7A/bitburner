# Type de fichier

## .daemon

Consomme des threads -> RAM minimum -> pas d'import, pas de run exterieur
Lancé en boucle par défaut
Input hasLoop pour povoir lancer une execution unique

## .worker + .manager

La fonctionnalité du combo .worker + .manager est égal au .daemon. 

Le .worker contient uniquement la partie work, le manager contient toute la logique, les condtions et imports.

Le choix entre utilisation du .daemon ou du combo .worker + .manager dépend du nombre de thread à lancer. Si le nombre est suffisament grand il est plus intéressant d'utiliser le combo .worker et .manager, car la RAM venant de la "logique" ne sera pas présent dans chaque thread mais pour un unique thread du .manager.
