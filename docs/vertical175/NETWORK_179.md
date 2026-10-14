# Les Enceintes du Ciel — liaisons et portage 179

## Périmètre

Suite de la PR #6 `feat/vertical-citadel-175`, sur la révision 178 `d0fffbc03b4ad4b3baaa7f073bc3f739bb84abc3`. Les onze âges, 39 supports, 31 équipements, sièges 175–176 et maintenance 177–178 sont conservés. Ni main ni la variante #7 ne sont fusionnés. Cette passe raccorde des structures jusque-là isolées et transporte des équipements existants ; elle ne prétend pas terminer tous les chantiers de l'extension.

## Passerelles financées et réellement parcourables

Deux supports différents doivent offrir un palier achevé à la même altitude, avec des faces alignées, une portée compatible et suffisamment de largeur libre. Une liaison horizontale dans le plan relie les deux rives ; les raccords diagonaux, passerelles inclinées et ponts courbes ne sont pas inclus. Les matériaux de la portée sont prélevés une seule fois au lancement. Le commandant doit rejoindre le bord de départ et y travailler. Le chantier est visible mais non traversable avant son achèvement. Une pause suspend le travail ; une interruption ou une reprise de sauvegarde conserve le chantier payé, sans le terminer ni le financer à nouveau.

Chaque extrémité prend la moitié de la charge structurelle du pont, y compris pendant les travaux. L'occupation des dalles, les autres liaisons, les équipements et les arbres bas sont vérifiés avant paiement. Une liaison basse interdit une nouvelle construction au sol qui traverserait son volume. Les bandes d'accès restent réservées contre l'installation et le déplacement d'équipements. Les garde-corps visuels sont ouverts au droit des raccords, au lieu de faire traverser une barre au joueur.

Le commandant marche dessus par le contrôleur natif avec contrôles successifs d'empreinte. Il reste à l'altitude du pont, change de support lorsqu'il atteint l'autre rive et peut sauvegarder au milieu. Le dessous reste traversable au sol. Les tabliers et garde-corps des ponts participent aux rayons de la même simulation que les affûts ; le rendu FPS emploie ces volumes, pas une seconde carte.

### Kits d'âge

Les kits n'augmentent pas le niveau de civilisation. Ils exigent l'âge déjà acquis, et leur hauteur maximale reste celle des plafonds 177. Les petites plateformes anciennes peuvent recevoir un kit plus récent tant que la charge est admissible.

| Âge | Altitude maximale du kit | Portée libre maximale | Charge d'équipement transporté maximale |
|---|---:|---:|---:|
| Refuge | 2 m | 3 m | 10 |
| Camp fortifié | 3 m | 6 m | 18 |
| Avant-poste | 6 m | 10 m | 26 |
| Forteresse | 12 m | 14 m | 36 |
| Ville | 18 m | 18 m | 50 |
| Grande ville | 24 m | 22 m | 60 |
| Métropole | 30 m | 26 m | 75 |
| Grande métropole | 42 m | 30 m | 90 |
| Mégaville I | 48 m | 34 m | 105 |
| Mégaville II | 60 m | 38 m | 125 |
| Mégaville III | 72 m | 42 m | 150 |

La charge est l'unité abstraite du catalogue, pas une promesse de simulation physique ou une masse en kilogrammes. Valeurs de coûts, durées, résistance, portée et manutention : `DeadwallCore.VerticalNetwork179`. Le dossier présente le prix de chaque liaison calculé pour sa portée réelle.

## Transport entre supports et étages

Dans **Citadelle → Liaisons et transport**, rejoindre un équipement achevé, puis l'emballer. Le travail consomme ses matériaux d'emballage à la fin. Tant qu'il est emballé, l'équipement n'est plus installé : ses places, son stockage ou sa production sont retirés réellement. Retirer une réserve est refusé si les stocks existants ne tiendraient plus. Pendant l'emballage, son tir automatique ou sa production sont suspendus.

Le porteur conserve l'objet, son identifiant, son intégrité et ses cartouches. La vitesse de déplacement est multipliée par 0,65 ; tir, mêlée, rechargement de l'arme personnelle et financement de constructions sont refusés pendant le portage. Le système refuse une deuxième charge de mission, exploration ou manutention native. La conduite d'un véhicule et le départ de D-17 avec cet équipement sont bloqués, car cette passe ne transporte pas les structures vers la carte régionale.

Il faut marcher jusqu'au nouveau support ou utiliser les escaliers/ascenseurs existants pour changer de palier. Les fonctions d'accès autorisent le portage ; les passerelles trop faibles refusent la charge. Au centre de la dalle d'arrivée, choisir un emplacement libre pour déballer le même équipement. Les collisions, dimensions, accès de pont et capacité portante sont revérifiés. Aucune arme neuve, cartouche gratuite ou restauration de santé n'est accordée.

Une caisse peut être posée, sauvegardée puis reprise à proximité et à la même altitude. Un décès dépose la charge avant la suspension de la simulation, sans attendre un tick supplémentaire. Une caisse dont le sol porteur s'effondre tombe au sol et subit des dégâts ; une caisse détruite ne rend ni matériel ni cartouches. Le portage est manuel et individuel : il ne constitue pas du fret automatisé par PNJ.

## Itinéraires, entretien et effondrement

Le dossier propose un itinéraire consultatif sur un graphe borné de paliers construits, d'escaliers internes et de passerelles achevées. Une lecture ne déplace personne et ne dépense rien. Ce graphe ne calcule pas encore les trajets de tous les PNJ ou les détours entre équipements ; il ne remplace pas les contrôles de collision physiques. Les raccords simplement contigus sans pont explicite ne font pas partie de ses arêtes.

Une passerelle endommagée se répare depuis l'ancrage contre matériaux payés en fin d'intervention. Sa dépose exige confirmation et absence d'acteur ou de caisse sur la portée ; la récupération est limitée à 35 % selon avancement/intégrité et place disponible. Les confirmations périment lorsque la liaison, les stocks ou les caisses changent. Une dalle servant d'ancrage ne peut pas être déposée ; retirer d'abord la liaison.

Les impacts des géants peuvent endommager les liaisons proches et à leur portée. La perte d'un ancrage retire immédiatement ses ponts, sans supprimer un support voisin encore intact. Un commandant au milieu chute et subit les dégâts natifs ; aucun remboursement n'est accordé. Ce n'est pas un calcul général d'effondrement par piliers ni une simulation de débris rigides.

## Sauvegarde et bornes

Le registre vertical passe à la version **3** avec un réseau version **1**. Les sauvegardes verticales v1/v2 sont migrées par ajout d'un réseau vide, sans gain ni confiscation. Les liens, chantiers, positions de traversée, charge portée et caisses sont persistants. Les travaux actifs de manutention ne sont pas repris automatiquement à leur achèvement.

Le chargement vérifie formes exactes, nombres finis, références aux supports/paliers, hauteurs, emprises, charge d'ancrage, doublons de liens et unicité des identifiants d'équipement entre installation/porteur/caisses. Il refuse une charge simultanée d'une autre opération avant de remplacer la campagne. Bornes : 64 liaisons, 32 caisses, graphe de 896 paliers ; les plafonds de 720 infectés natifs et 24 grimpeurs/occupants élevés ne changent pas.

## Vérification reproductible

```
node --test --test-concurrency=2 tests/vertical-*.test.cjs
node --test --test-concurrency=2 tests/core.test.cjs tests/urban-night.test.cjs tests/power-grid.test.cjs tests/expeditions.test.cjs tests/expansions127.test.cjs
npm run check
npm run build
node scripts/qa-vertical179.mjs
```

Le test navigateur prépare explicitement âge, ressources, déblaiement et achèvement de deux supports. Les ponts, modules, ravitaillement, emballage, déballage et trajets utilisent les commandes réelles. Le déplacement après l'entrée emploie le contrôleur natif avec collision, y compris lors de la sauvegarde en pleine traversée. Les résultats du commit réellement testé et les images produites dans l'artefact font foi. Ce n'est pas une campagne naturelle ni un benchmark matériel.

## État des chantiers ouverts

| Chantier | Avancée de 179 | Toujours à faire |
|---|---|---|
| Connexions de ville | Passerelles droites payées aux onze âges, collision, sauvegarde, entretien | Ponts diagonaux/courbes/inclinés, longues galeries fermées |
| Logistique d'étage | Portage manuel conservatif entre supports et étages, caisses récupérables | Personnel de fret, monte-charge dédié, files d'attente et stocks par quartier |
| Circulation | Graphe consultatif de paliers/escaliers/ponts, mouvement réel du commandant | Navigation complète des civils, ouvriers et infectés sur le réseau |
| Accès intérieurs | Les trajets d'escalier/ascenseur restent compatibles avec une charge | Escaliers libres, cabines animées, intérieur architectural détaillé |
| Construction verticale | Réutilisation des 31 équipements sans duplication | Placement libre de tous les bâtiments historiques sur les dalles |
| Intégrité | Charges d'ancrage et chute des ponts/cargaisons | Piliers endommageables, cascades structurelles, débris |
| Siège | Ponts vulnérables aux impacts proches des géants ; tirs cohérents | Traversée des ponts par les intrus, foule distante/LOD et pyramides de corps individuels |
| Présentation | Passerelles visibles dans les deux vues, garde-corps raccordés, charge portée visible | Art final, animations de portage, sons, finition générale du HUD |
| Qualification | Tests all-age et scénarios régressifs | Campagnes longues sans préparation, performances de foule et appareils physiques |
