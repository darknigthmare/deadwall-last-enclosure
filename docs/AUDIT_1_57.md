# Audit et corrections 1.57.0 — DEADWALL

Base : `ae10a4583c604b0ad7536d6c92c08449b27f1743`. PR intégré : #1, tête `bb1a08de7a88f68b03ac57b2626c3353c76b3862`. Les preuves de cette passe sont conservées sous `/workspace/deadwall-cloud/audit157/` ; les résultats de la 1.56 ne valent pas validation du candidat 1.57.

## Défauts reproduits

| Défaut | Correction |
| --- | --- |
| Un arbre G7 prélevé disparaît sous une nouvelle réservation G8 et fait refuser une sauvegarde légitime. | Registre historique fini des ressources couvertes ; les identifiants et budgets valident les prélèvements sans rendre ces ressources récoltables. |
| Les programmes résidentiels du Codex reçoivent le détail générique d'un magasin. | Famille transmise aux variantes, clôtures et intérieurs. |
| Des détails solides nouveaux emprisonnent une position d'une ancienne sauvegarde. | Version régionale optionnelle de détail : anciennes collisions conservées à 0 ; nouvelles campagnes à 1. |
| Un relevé sectoriel déjà payé devient incomplet après l'ajout de sites. | Découverte étendue uniquement aux nouveaux sites des secteurs déjà relevés. |
| Une implantation G8 recouvre une voiture, un bivouac ou un éclairage payé. | Refus avant toute mutation, avec déplacement/retrait laissé aux actions réelles du joueur. |
| La grille nominale d'un atlas coupe des silhouettes et prend des pixels du voisin. | Premier atlas de bâtiments rejeté, nouvelle génération ImageGen, puis coupes mesurées sur les gouttières réelles. PNG source inchangé. |
| Les nouveaux atlas risquent d'être absents du mode hors connexion ou du HTML autonome. | Registre d'images, scripts publics, build et cache PWA raccordés ensemble. Vérifications finales requises. |

## Preuves ciblées

Les corrections de migration et de génération terminent **61/61, code 0**. Un oracle compare deux seeds (17117 et 84329), G1 à G7, tous les lieux/plans et six chunks par monde : **14/14 couples identiques** contre la base. Il vérifie également 261 positions de collision historiques. Cela ne couvre pas toutes les seeds possibles.

Les premiers sprites passent leurs suites ciblées : **17/17** pour les détails, **20/20** pour les toits, **72/72** pour bâtiments et annexes. Les ciblés se recouvrent ; ils ne s'ajoutent pas au futur total de la suite générale. L'inventaire distingue une source existante, une image dédiée, une variante cosmétique et un état fonctionnel. Un changement d'étage, d'âge ou de charge ne compte pas comme variante.

Le premier atlas D17 conserve sa preuve négative de découpe ; la nouvelle source contient ses 823 449 pixels significatifs dans les seize coupes mesurées. Les tentatives négatives de migration et leurs corrections de fixtures restent également conservées.

## Couverture artistique

L’extension ajoute 79 silhouettes alternatives pour compléter les quatre familles initiales. Les 91 définitions représentent 93 usages en séparant les trois états du centre ; cinq regroupements de sources partagées donnent 83 modèles terminés distincts. Le nouvel appartement de quatre niveaux utilise un PNG séparé : la case de cinq niveaux de l’atlas A est explicitement ignorée. Les 143 nouveaux dessins utilisés occupent neuf atlas et un PNG individuel ; la case A ignorée et la case B vide sont exclues. Les mécanismes, véhicules et familles d’acteurs restent distingués des variantes de bâtiments ; ce document ne certifie pas une alternative cosmétique pour chacun d’eux.

## Portée

Les scènes préparées de fin de progression ou de grande horde ne prouvent pas l'acquisition naturelle de leurs ressources. Les images enregistrées dans un registre sans placement par le générateur ne sont pas annoncées comme présentes dans toutes les parcelles. Les fiches auteur et les adaptations jouables sont distinguées.

Cette documentation est figée avant les contrôles généraux. `DELIVERY_157.md` atteste ensuite les vrais codes de sortie, compteurs, sources, captures, performances, commit de fusion, état GitHub, état Vercel et fichiers publics. Les essais physiques, campagnes humaines complètes et validation commerciale restent des chantiers séparés.
