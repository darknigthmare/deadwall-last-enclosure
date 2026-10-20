# DEADWALL 1.68 — Chantiers et expéditions

Cette livraison reprend les améliorations des PR 10, 11 et 12 et les complète par six ensembles de construction et des corrections issues de reproductions ciblées. Les anciens mondes conservent leurs identités et leur géographie ; aucune nouvelle génération n’est imposée à une sauvegarde.

## Construction et Codex

| Ensemble | Premier âge | Usage |
| --- | --- | --- |
| Relais de service | 2 | Entrepôt, halte, citerne incendie et éclairage |
| Cour d’entretien | 3 | Atelier, générateur, entrepôt et citerne |
| Lignes de repli décalées | 4 | Deux fronts béton, portes décalées, Hérissons et secours |
| Cour électrique | 6 | Centrale, solaire, citerne, entrepôt et éclairage |
| Cour de médecine et secours | 10 | Triage, stérilisation, caserne incendie et logistique |
| Cour de ravitaillement de siège | 11 | Arsenal, accumulateur, solaire et ravitaillement |

Le bureau de chantier est nécessaire. L’aperçu ne dépense rien ; financer paie chaque fondation et crée des bâtiments inachevés. Les côtés et accès de service sont ouverts : les plans ne constituent pas une enceinte complète. Les services terminés demandent leurs intrants habituels. Les accumulateurs ne reçoivent aucune charge gratuite. Les sprites existants correspondent aux bâtiments réellement construits ; ces compositions n’introduisent pas de nouveaux bâtiments ni de nouveaux sprites individuels.

Les six fiches se raccordent aux choix réels du catalogue. Les quinze anciens ensembles, les 180 choix historiques et les 4 000 identités des programmes territoriaux restent préservés. Les compteurs globaux du Guide incluent aussi les supports verticaux enregistrés au démarrage.

## Corrections de terrain

- La recherche d’eau douce examine les berges physiques : une rivière accessible à 2,19 m ne peut plus être manquée entre deux rayons. Portée, obstacles, ponts, salinité et annulation en cours de travail restent vérifiés. Voir [la collecte aux berges](BANK_WATER201.md).
- La présence coopérative lit l’étage réel et le support de D-17 ; changer de surface masque les contacts précédents. Voir [la présence en hauteur](COOP_FLOOR_201.md).
- Les corps des infectés en hauteur suivent leur surface et ne remplissent plus les tas de cadavres du sol. Voir [les cadavres en altitude](CORPSE_ALTITUDE_201.md).

## Améliorations reprises des PR

Le Carnet joueur propose les opérations et les systèmes dans le menu de campagne. Les erreurs de création audio libèrent leurs ressources ; un échec d’autosauvegarde évite les alertes répétées. Les services d’élevage rendent leurs estimations sans travail ni réserve offerte, et les camps du sol ne desservent pas un commandant en hauteur.

Le seau porté partage les mêmes stocks entre remplissage, arrosage, extinction et autres opérations compatibles. Soin, réparation, abreuvement et reproduction utilisent leurs coûts, leur durée, leur portée et leur reprise sauvegardée. Les gestes des bras accompagnent les opérations concernées. Les entrées après un long affichage et les débuts de campagne refusés conservent leur état correctement. Le relais coopératif sépare les cartes et surfaces et attend son accusé de réception avant d’afficher la présence.

## Qualification

Les résultats doivent être attachés au SHA réellement testé. Les tests natifs préparent parfois des états avancés pour exercer une transaction précise ; ils ne prouvent pas une campagne humaine de 6 à 10 heures. Les agents de revue ne sont pas des testeurs humains. Une capture navigateur, un contrôle de géométrie et une mesure sur téléphone physique sont des preuves distinctes ; seule une preuve effectivement produite doit être annoncée.
