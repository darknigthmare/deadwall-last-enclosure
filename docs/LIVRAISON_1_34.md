# DEADWALL 1.34 — Armement & ateliers

Cette version reprend intégralement la livraison 1.33 « Routes & Relève ». Elle ajoute un arsenal persistant, des interventions techniques sur les lieux existants et des renforts physiques sur les ouvertures.

## Prise en main

1. Ouvrir `DEADWALL_Standalone.html` après extraction de l'archive complète.
2. Dans **Opérations → Équipement → Armurerie**, comparer les armes, assembler au dépôt, transférer au harnais puis équiper. Le travail consomme les stocks réels. Recharger utilise les munitions accessibles au survivant.
3. Près d'un coffre verrouillé ou d'un dispositif technique, ouvrir **Interventions**. Le temps continue pendant les mini-jeux : sécuriser l'endroit avant de commencer.
4. Dans **Opérations → D-17 → Ouvertures**, sélectionner la porte, le portail ou la fenêtre à portée, puis poser un renfort. Les matériaux proviennent du sac. Ce renfort bloque aussi le joueur et peut être démonté depuis les deux côtés.

## Contenu

- 37 profils d'armement : 18 armes à feu, 6 de mêlée, 4 de fortune, 5 outils et 4 dispositifs posables à D-17.
- Exemplaires individuels, chargeurs, poids, harnais de 22 kg, râtelier au dépôt, usure, entretien et récupération après la mort.
- Trois familles de mini-jeux : crochetage, réglage de générateur, diagnostic du tableau. Les verrous concernent les contenants compatibles et réserves spéciales, pas toutes les portes du monde.
- Générateurs régionaux avec état, carburant et bruit ; tableaux par étage, lumières effectives et travail accéléré sur certaines machines. Leur énergie reste propre au site.
- Trois renforts : planches croisées, bois contreventé et tôle rivetée. Portes de stations, portails de cours, fenêtres brisées de stations D-17, portes extérieures et passages intérieurs régionaux.
- 40 nouvelles fiches du guide, dont 37 profils alimentés directement par les règles du jeu. Le catalogue autonome se trouve dans `codex-3000/addendum-1.34/LIRE_ARMEMENT_1_34.html`.

## Corrections de cohérence

La perspective des maisons de D-17 utilise des toits et des façades courtes, avec une verticale d'écran constante. Les épaves tournées et accessoires utilisent une emprise correspondant au dessin. Les grandes collisions de véhicules issus des atlas ont été ajustées sans déplacer les anciens gisements.

Le tir et la visibilité tiennent compte des murs du terrain généré. Le calcul d'impact compare obstacle et infecté sur le même segment ; les règles historiques de tir au-dessus des fortifications basses restent conservées.

L'audit des systèmes historiques a raccordé la puissance des annexes au vrai réseau, protégé les registres lors d'un démarrage refusé, relié l'inventaire aux exemplaires réels de l'armurerie et remplacé l'ancien raccourci chronométré d'ouverture des réserves par le mini-jeu. Les migrations utiles restent présentes.

## Portée de validation

Les journaux et images de cette livraison sont dans `reports/1.34.0`. Les captures utilisent les peintres réels et un Canvas natif avec un DOM simulé. Elles ne certifient pas la mise en page CSS dans un navigateur, les commandes tactiles sur appareil, l'audio ou les FPS GPU.

Cette livraison est un jeu autonome et ses sources. Elle n'annonce aucune mise à jour GitHub ou Vercel.

## Guides spécialisés

- `docs/ARSENAL_1_34.md`
- `docs/INTERVENTIONS_1_34.md`
- `docs/BARRICADES_1.34.md`
- `docs/TERRAIN_1_34.md`
- `docs/LEGACY_AUDIT_1_34.md`
- `docs/QA_INTEGRATION_1_34.md`
