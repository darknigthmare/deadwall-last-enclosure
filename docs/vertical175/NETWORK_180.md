# Les Enceintes du Ciel — invasions du réseau, révision 180

## Base et périmètre

Suite de la PR #6, `feat/vertical-citadel-175`, sur le code 179 `a7bc2232a6cb83db62f4ce7f1e8a43c9e036a131`. Les passes 175–179, les onze âges, 39 supports, 31 équipements et onze kits de passerelle sont conservés. `main` et la variante PR #7 ne sont ni fusionnés ni modifiés.

180 prolonge les infectés natifs déjà montés : traversée des passerelles construites, inspection des étages par les escaliers, combat sur les installations d'arrivée, sauvegarde du trajet et sécurisation des déposes. Ce n'est pas encore la navigation générale des civils et des ouvriers.

## Une seule topologie et les mêmes ennemis

Le graphe consultatif 179 et les intrus lisent maintenant `network.navigationGraph(payload)`. Il contient uniquement des paliers achevés, des escaliers entre deux paliers consécutifs et des passerelles achevées avec ancrages valides. Les graphes retournés sont de nouvelles collections, sans référence mutable vers les possessions. La charge transportée du joueur ne peut plus être utilisée implicitement pour décider si un autre acteur peut traverser.

Un récent ou un rampant qui atteint le sommet garde son objet natif, identifiant, santé, butin et place dans le budget de vague. Il suit les accès disponibles, arrive au bord par des déplacements bornés, marche sur la portée puis change de support sur l'autre rive. Les chantiers de pont ne constituent jamais un sol. Aucun ennemi supplémentaire n'est créé et aucun infecté n'est téléporté d'un support à l'autre.

Sur un palier, les cibles locales doivent être visibles : le contrôleur privilégie le commandant présent ou les équipements rencontrés. Sans cible locale visible, l'infecté inspecte les paliers reliés, avec mémoire transitoire des lieux visités. Cette inspection n'acquiert pas la position cachée du commandant. Les tirs et le corps-à-corps gardent l'altitude et les rayons du système 175–176.

Les détours locaux utilisent un petit graphe autour des emprises réelles des équipements, un nombre borné de sommets et des segments vérifiés par pas. Les itinéraires sont réévalués ; un équipement ou une rupture de liaison ne permet pas de traverser un obstacle. Les acteurs ne disposent pas encore d'évitement mutuel sophistiqué ni de gestion de congestion.

## Escaliers entre paliers

L'infecté rejoint physiquement le centre du palier avant de commencer le trajet intérieur. L'altitude varie progressivement vers le palier voisin. Une coupure électrique ne bloque pas cet escalier. L'infecté ne conduit pas l'ascenseur et ne descend pas encore par un escalier jusqu'au monde au sol.

**Représentation provisoire :** le trajet intérieur est contraint et temporisé, comme celui du joueur ; il ne représente pas encore une cage d'escalier librement parcourable avec chaque marche, portes coupe-feu et cabine animée. Les dalles ne possèdent pas encore de découpes architecturales finales pour les cages.

## Déposes, perte d'ancrage et conséquences

La présence d'un intrus engagé sur une passerelle empêche sa dépose. Le contrôle intervient avant la confirmation et à chaque pas de travail ; l'arrivée d'un infecté pendant une dépose interrompt l'opération sans remboursement ni suppression de la liaison. Une dalle actuellement empruntée ou visée par un escalier d'infecté ne peut pas être déposée. La démolition depuis l'outil au sol refuse aussi un support occupé.

La rupture d'un pont déclenche immédiatement la résolution de ses occupants. Un infecté encore porté par la rive conserve cette rive ; au milieu, il perd son état élevé et subit les dégâts de chute historiques. Le point au sol est recherché dans un voisinage borné respectant les collisions. Sans réception possible, l'infecté est éliminé ; il n'est pas déplacé de l'autre côté du monde. La destruction du support propriétaire garde le comportement destructif de 176. Ce n'est ni une chute avec corps rigides ni un calcul de cascade de piliers.

Les intrus arrivés sur une fondation peuvent endommager ses modules réels. La destruction d'un logement retire sa capacité, celle d'un affût interrompt sa possession. La projection classique place aussi l'infecté devant le tablier du pont, au lieu de le masquer derrière un ancrage.

## Sauvegarde

Le registre vertical passe de **v3 à v4**. Chaque infecté élevé ajoute `level`, `bridge` et `stair`. Les formats v1/v2/v3 restent migrables sans subvention, ajout de liaison, duplication d'ennemi ni soin. Les nouvelles données conservent la position native et la progression d'escalier ; les itinéraires et mémoires de recherche restent transitoires, reconstruits à la reprise.

La validation refuse les liaisons manquantes ou inachevées, les extrémités incompatibles, les niveaux non bâtis, les sauts de palier, les valeurs non finies et les positions hors sol porteur ou incohérentes avec la cage d'escalier. Un refus précède le remplacement de la campagne.

## Couverture des âges

Les onze kits restent ceux de 179, avec leurs coûts et contraintes. Les tests 180 font traverser les kits d'âges 0 à 10 sur des supports de **2, 3, 6, 12, 12, 18, 24, 36, 48, 60 et 72 m** respectivement. Ces hauteurs sont celles des supports de test, pas de nouveaux plafonds de financement. Les plafonds de dalles 177 (2 / 3 / 6 / 12 / 18 / 24 / 30 / 42 / 48 / 60 / 72 m) ne changent pas.

Les fixtures de traversée installent explicitement un infecté natif sur le palier initial pour isoler les onze géométries ; un test distinct et le scénario navigateur partent d'un vrai infecté au pied d'un rempart avec pression préparée, et vérifient la chaîne montée → pont → escalier → combat. Il ne s'agit pas de onze campagnes montées naturellement jusqu'à leur âge.

## Bornes et vérification

Les plafonds restent **720 infectés actifs**, **24 infectés élevés**, **64 liaisons**, **32 caisses** et **896 paliers dans le graphe**. Les paramètres nouveaux figurent dans `DeadwallCore.VerticalRouting180`, dans `src/core.js`. Aucune hausse de santé ni de budget des vagues n'est introduite.

```sh
node --test --test-concurrency=2 tests/vertical-*.test.cjs
node --test --test-concurrency=2 tests/core.test.cjs tests/urban-night.test.cjs tests/power-grid.test.cjs tests/expeditions.test.cjs tests/expansion-kit.test.cjs
npm run check
node scripts/qa-vertical180.mjs
```

Les reçus du commit effectivement testé et `QA_179_180.md` font foi. Les résultats antérieurs ne certifient pas cette révision. Voir `CHANTIERS_VERTICAUX.md` pour les limites restantes.
