# Sortie locale des véhicules — 1.40

## Défaut confirmé

La descente locale cherchait une arrivée à pied libre parmi seize positions, sans vérifier le passage depuis le véhicule. Avec une fenêtre renforcée, elle pouvait déposer le conducteur de l’autre côté de la barricade.

Le scénario charge le vrai document dans son ordre de scripts avec `bootDocument134`, graine 17117. Un garage achevé est préparé sur une emprise admise et le break est réellement payé. La vraie ouverture `local:station-1:window:broken-east` reçoit des planches par construction : 6 bois et 1 ferraille consommés une fois, renfort de 120 PV. Une pose de conduite avancée est restaurée à `(2586,2538 ; 1056,7)`, à l’intérieur de la station, après vérification de l’emprise du véhicule avant et après restauration.

Dans la version 1.39, la première arrivée choisie `(2629,2538 ; 1056,7)` est libre pour un piéton mais traverse le renfort. La ligne physique est bloquée et le premier obstacle est cette même barricade. Le scénario de comportement échoue précisément sur ce passage ; son contrôle de descente libre en bus passe déjà.

## Correction

`src/expeditions.js` exige également une ligne physique libre entre le véhicule et chaque sortie proposée. Il réutilise `nightGear.localLineClear`, qui consulte les obstacles existants et la grille commune, avec repli sur `hostileLineClear` si ce module n’est pas chargé. Le choix conserve ses seize positions, sa distance et le contrôle d’arrivée à pied.

Le break choisit désormais une sortie intérieure `(2569,7984 ; 1016,9732)` sans traverser la barricade. Le conducteur marche réellement, remonte dans son véhicule et conserve ce résultat après sauvegarde puis chargement. Carburant, coffre, sac, ID et renfort restent identiques pendant la descente et la remontée.

Ce raccord vérifie une ligne de passage et l’emprise à l’arrivée ; il ne crée pas un nouveau calcul de balayage continu du corps du piéton. Aucun générateur, plan, rayon, profil, coût ni format de sauvegarde n’est modifié. `src/frontier.js` reste identique à la version 1.39.

## Faux positif écarté

Un bus stationné à l’extérieur de la même fenêtre descend par une sortie qui s’éloigne naturellement du renfort. Le passage et l’arrivée sont libres : aucune correction spécifique au bus ni changement de sa taille locale n’est justifié.

## Vérification

- `DEADWALL_QA_ROOT=/workspace/scratch/001defc40d26/work/baseline139 node --test --test-reporter=tap tests/world140.test.cjs` : un échec attendu sur le passage barricadé, un contrôle libre réussi.
- `node --test --test-reporter=tap tests/world140.test.cjs tests/world138.test.cjs tests/expeditions.test.cjs` : 47 contrôles réussis sur 48. Le seul cas interrompu est `bus-g5`, arrivé à la limite de 45 secondes de son processus enfant, sans assertion physique échouée. Son exécution isolée réussit ensuite : aller et retour local/région G5, conduite réelle, conservation et reprise.

Les deux nouveaux scénarios passent, ainsi que les 36 contrôles historiques d’expéditions et les neuf autres scénarios régionaux 1.38. Les preuves sont sous `reports/1.40.0/` : `world140-break28-before.json`, `world140-door-after.json`, `world140-baseline139.tap`, `world140-targeted.tap` et `world140-bus-g5-rerun.json`. La recherche de faux positif est conservée dans `world140-door-before.json`.

Les scénarios exécutent les contrôleurs et interactions réels sous DOM simulé. Ils ne certifient pas la présentation CSS, le tactile matériel, l’audio ou les FPS du navigateur. Aucune illustration manquante n’a été identifiée dans ce raccord physique.
