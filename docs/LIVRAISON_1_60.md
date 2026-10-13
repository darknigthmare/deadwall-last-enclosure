# DEADWALL 1.60 — Ouvrages, territoires et services de terrain

Cette version raccorde les **626 programmes exclus en 1.59** à des contrats et des plans physiques G10 : **300** n'avaient pas de preset natif et **326** nécessitaient un contexte territorial absent. Le catalogue conserve ses 4 000 programmes et leurs identités ; il n'ajoute pas 626 fiches indépendantes. Les compositions dérivées conservent leur parent et leur propre contexte.

## Activer et explorer G10

1. Charger une campagne G8 ou G9 et rejoindre à pied le dépôt de D-17 avec le commandant disponible.
2. Dans le commandement, ouvrir Dossiers, Région, Relais lointains : le dossier porte le titre **Monde & relais**.
3. Choisir **ACTIVER LES 626 PROGRAMMES TERRITORIAUX**. Depuis G8, l'opération inclut aussi les implantations G9. Un refus indique la condition matérielle à résoudre.
4. Explorer normalement, puis consulter **Ouvrages & services** à proximité d'un nouveau lieu repéré pour ses interventions disponibles.

L'activation ne coûte ni matériau ni temps et n'offre aucune ressource. Elle conserve les lieux antérieurs, leurs IDs, réserves déjà prélevées, découvertes et possessions. Elle refuse de recouvrir les supports et positions conservés : voiture, camp, éclairage, dispositif, colis, corps ou sac, contact et fondation annexe. Elle ne déplace pas ces éléments pour imposer l'extension.

Les **626 programmes sont éligibles**, mais chaque région n'en contient pas nécessairement 626 nouveaux exemplaires. Le générateur cherche une emprise et des accès compatibles, avec au plus 96 essais par candidat ; une instance impossible est refusée. Les programmes routiers, ferroviaires, hydrauliques, portuaires et de quartier reprennent l'emprise minimale auteur. Les 326 intérieurs existants conservent leurs plans métriques et niveaux, avec un contexte extérieur déclaré.

La consultation du Guide n'active pas G10, ne dépense rien et ne révèle aucun lieu inconnu. Son filtre des programmes G10 indique leur disponibilité logicielle ; leurs liens de carte et repères utilisent seulement les découvertes de la campagne. Les anciennes générations G1–G9 gardent leurs comportements et plans historiques.

## Travaux et réserves

Les interventions utilisent les matériaux **du sac**, avec un paiement unique **à la fin du travail effectif**. Les coûts et durées proviennent de `ContextRules160` dans `src/core.js`.

| Travail | Temps actif | Coût | Résultat |
|---|---:|---|---|
| Rétablir cet accès | 16 s | 8 bois + 6 ferrailles | Ouvre une obstruction physique déclarée |
| Purger ce bassin | 18 s | 2 carburants + 3 ferrailles | Dégage le bassin prévu dans le plan |
| Déverrouiller cet aiguillage | 10 s | 4 ferrailles | Libère l'accès associé à l'aiguillage |
| Soins au poste médical | 10 s | 1 médicament | Rend au plus 20 PV, dans la limite de la santé manquante |

Le joueur doit rejoindre le point d'intervention à pied, à moins de 2,2 m, sur le bon niveau et avec une ligne libre. Un support détruit, des mains occupées, un rechargement ou une menace visible à moins de 12 m empêchent le travail. Déplacement, blessure, tir, changement du sac ou perte du support interrompent une tâche avant son débit. Pause et modale suspendent l'avancement. Une sauvegarde conserve les réalisations achevées ; un travail inachevé est annulé à la reprise, sans prélèvement.

Accès, bassins et aiguillages ne sont payables qu'une fois par intervention. Les soins restent répétables pour un blessé, au prix d'un médicament par soin achevé. La purge n'ajoute pas une ressource d'eau et ne rend pas l'eau potable. L'aiguillage ne met pas un train en circulation. Les réserves du lieu héritent d'un budget fini unique ; multiplier les volumes ou les contenants ne multiplie pas ce budget.

Les camps alliés réutilisent les relais et soins payés existants. Les camps hostiles désignent **d'anciens camps abandonnés occupés par des infectés** ; ils ne créent pas une faction de combattants humains. Les ports, locomotives et wagons offrent des décors et parcours d'exploration ; cette version n'ajoute pas de train ni de bateau pilotable.

## Atlas, variantes et disponibilité hors ligne

Trois PNG originaux de 1 536 × 1 024 pixels ajoutent **48 découpes**, soit **24 familles à deux variantes**. Leur volume total est de **8 211 248 octets**, environ 8,2 Mo. Leurs prompts, empreintes et rectangles mesurés sont conservés dans [`assets/art160/PROVENANCE.json`](../assets/art160/PROVENANCE.json).

- `civil-rail.png` : piles, portails, voies, aiguillages, abris de quai, signaux, locomotives et wagons.
- `water-port.png` : bases et rotors de pompe, corps et volants de vanne, portes d'écluse, bases, bras et crochets de grue.
- `shore-services.png` : châteaux d'eau, bassins, filtres, roseaux, rochers de rive, falaises et berges.

Les composants mécaniques sont séparés de leurs bases. Leur pose observe une intervention réellement en cours ou son état achevé ; un décor inactif ne simule pas une production. Les variantes sont choisies de façon déterministe depuis la graine et l'identité. Les volumes de quartier réutilisent aussi les toits et matières existants ; une seule grande toiture ne recouvre pas toute leur emprise. Les sols et effets procéduraux conservés gardent leur fonction.

Les **143 images historiques** gardent leur chargement initial. Les **trois nouvelles images** se chargent et se décodent à la demande, avec au plus deux demandes actives. Le rendu de secours reste disponible si une image ne charge pas. Ce report ne réduit pas le poids des images historiques ni celui du paquet autonome complet.

La **PWA** précache le noyau et ses ressources obligatoires. Les trois atlas G10 sont des ressources optionnelles : leur première consultation connectée les met en cache. Une simple visite du menu ne garantit pas leur disponibilité hors ligne. Le **HTML autonome** incorpore les trois PNG et les décode à la demande ; cela ne dispense pas de qualifier le transport `file://` sur son système. La version Windows et les appareils physiques exigent leurs propres contrôles.

## Références partiellement adaptées

Les 626 contrats permettent une implantation G10 ; **18 fiches issues de six parents ne reproduisent pas intégralement les prescriptions multiniveaux auteur**. Leur champ `implementation160.fullyImplementedReference` vaut `false`, et le Guide affiche leur adaptation.

| Parent | Fiches concernées | Parcours livré et limite |
|---|---|---|
| Viaduc | DW-0266, DW-1531, DW-1532 | Parcours visitable au sol ; route haute ou basse de référence fermée |
| Passage inférieur | DW-0268, DW-1535, DW-1536 | Parcours visitable au sol ; superposition de routes non activée |
| Échangeur autoroutier | DW-0269, DW-1537, DW-1538 | Parcours visitable au sol ; branches dénivelées de référence fermées |
| Passage ferroviaire supérieur | DW-0292, DW-1583, DW-1584 | Parcours visitable au sol ; axe supérieur de référence fermé |
| Aqueduc ancien | DW-0348, DW-1695, DW-1696 | Inspection visitable au sol ; inspection supérieure et distribution d'eau non activées |
| Station de métro | DW-0294, DW-1587, DW-1588 | Station couverte au niveau auteur 0 ; sous-passages de la référence fermés |

Ces domaines fermés ne créent ni passage par simple superposition XY, ni étage implicite, ni changement de hauteur de véhicule. Le texte et les identifiants de conception restent conservés pour une extension ultérieure.

## Vérification et livraison

```sh
npm ci
npm start
DEADWALL_SOAK=1 npm run check
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:contexts
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:sprites
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:codex
```

La qualification doit distinguer les contrats et géométries, les transactions d'intervention, la migration G10, les images à la demande, le début de campagne par commandes réelles et les scènes avancées préparées. Les fixtures de site, de sac, de santé et de menace utilisées pour contrôler un travail ne représentent pas un trajet naturel de plusieurs heures. Les reçus de travail sont conservés dans `/workspace/deadwall-cloud/audit160` ; les tentatives négatives restent distinctes de leurs relances corrigées.

Ce guide décrit le périmètre et la procédure. Il ne certifie aucun total de tests réussi, aucun commit publié ni aucune version HTTPS sans leurs preuves finales propres. Après validation et commit propre, `npm run package:web` fabrique les paquets Web/PWA et HTML autonome, et `npm run package:source` fabrique le paquet source avec ses manifestes. La CI Windows, les archives et Vercel doivent chacun être liés au SHA livré.

La cible Standard de **6 à 10 heures** attend encore des campagnes humaines complètes. Les essais cloud et vues mobiles émulées ne certifient pas la fluidité sur un appareil physique. Les limites commerciales et notices restent documentées dans [DESKTOP.md](DESKTOP.md) et [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
