# Les Enceintes du Ciel — sièges verticaux 176

## Périmètre

Suite de la PR #6, branche `feat/vertical-citadel-175`, sur le code WebGL intégré en `b48a74bdbd5f9e3e49b989206e9de64af5c400fa`. La PR #7 est une variante indépendante : ses valeurs et son moteur ne sont pas fusionnés ici. Aucun changement de `main`, aucune activation en production.

Cette passe ferme une partie des chantiers de siège et de cohérence des étages. Elle ne termine pas l'intégralité de l'extension massive. Les onze âges et les systèmes natifs restent en place.

## Constructions ajoutées

| Famille | Hauteur | Âge | Pierre / ferraille | Intégrité | Charge |
|---|---:|---|---:|---:|---:|
| Porte de citadelle | 12 m | Forteresse, 3 | 260 / 160 | 2 800 | 160 |
| Porte de grande enceinte | 24 m | Métropole, 6 | 560 / 320 | 5 000 | 220 |
| Porte de muraille ultime | 48 m | Mégaville I, 8 | 1 100 / 650 | 8 500 | 320 |
| Bastion d'angle | 12 m | Forteresse, 3 | 240 / 110 | 4 200 | 180 |
| Bastion de grande enceinte | 24 m | Métropole, 6 | 540 / 260 | 7 000 | 240 |
| Bastion de muraille ultime | 48 m | Mégaville I, 8 | 1 080 / 560 | 12 000 | 340 |

Les valeurs autoritaires sont dans `VerticalCitadel175.bases`, dans `src/core.js`. Les constructions utilisent les ressources et chantiers existants, les emprises et rotations du moteur. Aucun ajout gratuit dans les anciennes sauvegardes. Les bastions sont des supports carrés adaptés aux raccords d'angle, pas encore un jeu complet de pièces architecturales en L, courbes ou de passerelles suspendues.

Une porte ouverte conserve sa dalle haute : seule la partie basse de son volume devient un passage. Le dessous permet le passage et le tir au sol, tandis que l'arche continue de bloquer les rayons plus hauts. Une personne au sol bloque la fermeture ; le commandant ou un infecté sur le chemin de ronde ne bloque pas à tort cette fermeture. Les passages sont encore des volumes simplifiés, sans ailes de portail et animation mécanique finales.

Les supports voisins de même hauteur sont parcourables par le commandant. Les vides et les équipements restent bloquants ; les quatre coins de l'empreinte du personnage sont contrôlés.

## Horde : pression et franchissement réel

L'ancien franchissement des murs géants par le pathfinding au sol est supprimé : une accumulation de corps ne transforme plus ces murs en cellules librement traversables. La logique historique des petites palissades est conservée.

Un contrôleur rattaché à la citadelle lit les infectés natifs et la pression des cadavres. Chaque infecté au sol contribue à une seule face de mur proche et accessible. La pression des cadavres déjà sauvegardée est répartie entre les quatre faces ; la masse vivante est attribuée au front réellement occupé. La hauteur de l'amas est dérivée et plafonnée à celle du support. Ce modèle est un équilibrage de jeu, pas une simulation anatomique ni physique de chaque corps.

Lorsque la masse suffit, seuls les profils récents et rampants commencent une ascension. Ils gardent leur objet natif, identifiant, santé, budget de vague et butin. Leur position et altitude progressent au pied de la façade, puis ils franchissent le rebord. Ils ne sont ni dupliqués ni téléportés au sommet. Si le support de corps disparaît, ils redescendent et subissent des dégâts de chute calculés depuis leur hauteur effective.

Au sommet, les infectés rejoignent le commandant visible sur leur support ou attaquent les équipements réels. La destruction d'un logement retire ses places ; la destruction d'un affût contrôlé rend la main au joueur. Le déplacement emploie un évitement local borné : ce n'est pas encore une navigation générale entre tous les supports, étages et escaliers.

La présentation affiche des amas étagés et les mêmes infectés montants dans les deux vues. Les amas sont une représentation de pression agrégée ; leurs volumes ne remplacent pas une pile de corps rigides avec collisions individuelles. Les corps visuels historiques et leur déblaiement restent distincts de cette pression persistante.

### Bornes de charge

Le plafond natif reste à **720 infectés actifs**, avec **24 ascensions/occupants élevés détaillés au maximum** dans le registre. Aucun ennemi supplémentaire n'est créé pour donner artificiellement une apparence de foule. Les grandes vagues restent étalées par le budget historique ; cette passe ne livre pas des dizaines de milliers de zombies simulés en parallèle.

## Combat et caméras

Les collisions de tir prennent en compte l'altitude réelle des infectés. Un projectile au sol ne touche plus une cible située douze mètres au-dessus par simple superposition 2D. Un mur géant fermé bloque ce tir ; le passage d'une porte ouverte le permet. Les tirs depuis un affût ou le commandant élevé visent le volume correct. En vue classique, la sélection tient compte de la projection du sprite élevé ; en FPS, le même rayon et les mêmes dégâts sont utilisés.

Le corps-à-corps sol/toit est refusé. Les attaques du chemin de ronde ne traversent pas un équipement opaque. Un emplacement occupé par un infecté refuse une construction avant paiement.

Le bouton **TIR** accepte aussi Espace et Entrée lorsqu'il a le focus. Perte de focus, masquage de la page ou perte de contexte WebGL annulent le tir maintenu. Une perte de contexte retourne à la vue classique ; après restauration, choisir de nouveau FPS recrée les ressources graphiques sans recréer les munitions, les ennemis ou la possession. Le navigateur de test local ne fournissant pas WebGL, cette dernière partie doit être qualifiée par le scénario GitHub, pas déduite d'un test de simulation.

## Sauvegarde et sécurité

Le registre `expansions127.modules.vertical175` passe en **version 2**. La version 1 est migrée par ajout d'une liste de grimpeurs vide, sans récompense ni régénération. Chaque grimpeur référence un infecté natif vivant et un support achevé. L'ascension, la chute, l'altitude et la position sont restaurées ensemble.

Les doublons, références absentes, valeurs non finies, voies impossibles, corps hors du sol ou dans un équipement et positions divergentes sont refusés avant mutation de campagne. Tuer un infecté retire sa référence ; perdre un support retire ses occupants et capacités. La perte structurelle reste simplifiée : les infectés portés sont éliminés, sans simulation de débris rigides ni cascade de piliers.

## Vérification reproductible

```
node --test --test-concurrency=2 tests/vertical-citadel175.test.cjs tests/vertical-siege176.test.cjs
npm run check
npx playwright install chromium
node scripts/qa-vertical175.mjs
node scripts/qa-vertical176.mjs
```

Résultat local de cette révision : **43/43 tests ciblés réussis**, dont les 23 de la tranche précédente et 20 cas nouveaux ; pas de tests ignorés. Syntaxe : **264 fichiers**. Build : **342 fichiers publics**. La tentative générale locale s'est arrêtée sans succès global : `@napi-rs/canvas` manque, et l'archive historique n'inclut pas les fixtures `reports/`. Le dépôt complet et les dépendances verrouillées sont utilisés dans GitHub Actions.

Le scénario navigateur 176 prépare explicitement un âge avancé, achève la base dans la fixture, fournit une forte pression de cadavres et avance le temps par les contrôleurs de production. Il teste les boutons réels, les portes, le trajet d'un infecté, la sauvegarde en pleine montée, le tir FPS au clavier, la perte/restauration de contexte et l'interface à 390 × 844. Ce n'est ni une progression naturelle de campagne, ni un essai sur téléphone physique. Les résultats et `TESTED_HEAD.txt` publiés dans l'artefact font foi ; un succès de l'ancien commit ne valide pas les nouveaux ajouts.

## Chantiers encore ouverts

Les intérieurs d'escaliers librement parcourables, les cabines détaillées et le fret ; la navigation verticale générale des civils, ouvriers et infectés ; les passerelles et réseaux entre bâtiments ; le placement libre de tous les bâtiments historiques sur dalles ; les contraintes de piliers et effondrements progressifs ; les masses de corps individuelles et le LOD des foules ; les modèles, textures, animations, sons et éclairages finaux ; l'équilibrage et les longues campagnes multi-appareils. Les géants 175 restent les profils de 6/12/20 m, sans import de la variante #7.
