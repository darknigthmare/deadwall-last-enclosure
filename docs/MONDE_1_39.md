# Cohérence des gestes en région — 1.39

## Défauts reproduits depuis la 1.38

Les scénarios utilisent le démarrage complet `bootDocument134` dans l’ordre des scripts du document. Le garage est réellement construit, le véhicule réellement payé, puis une pose de campagne avancée est restaurée sur une emprise libre. Une recharge est lancée par `startReload()` ; ce n’est pas un booléen artificiel de test.

- **Plein au volant** : `frontier.refuel()` acceptait de verser 3 carburants du sac et 2 du coffre pendant la conduite. Le réservoir passait de 10 à 15 sans descendre du véhicule.
- **Embarquement pendant la recharge** : après un débarquement physique et le démarrage d’une recharge de 1,35 seconde, `frontier.board()` rendait le commandant conducteur sans interrompre cette recharge.
- **Coffre et plein pendant la recharge** : les commandes régionales déplaçaient les ressources du sac puis versaient leur carburant dans le réservoir alors que les mains rechargeaient encore.
- **Contourner le refus par SAC & RELAIS** : `fieldSupplies.transfer()` permettait de déposer 1,25 bois et retirer 1,5 carburant pendant la même recharge.
- **SAC & RELAIS pendant le contrôle d’un mirador** : le véritable bouton `supplyWithdraw-scrap`, avec dépôt sélectionné et quantité 1, déplaçait la ferraille du dépôt vers le sac (20→19 et 0→1) tandis que le poste restait contrôlé. La reproduction passe aussi sur la version 1.38 isolée (`world139-mounted-baseline138.json`).
- **Crochetage payé** : auprès du vrai coffre verrouillé `P0000:car:2`, une tentative coûtant 1 ferraille pouvait coexister avec les manipulations du coffre, du réservoir et l’embarquement. Le mini-jeu conservait son ancien contexte jusqu’à sa prochaine vérification.

Les traces sont `world139-before.json`, `world139-paid-before.json`, `world139-paid-baseline138.json` et `world139-supplies-before.json`. Le jeu 1.38 isolé confirme les cinq échecs comportementaux dans `world139-baseline138.tap`.

## Correction

`src/frontier.js` partage un contrôle des mains disponibles avant les gestes de matériel : pas de recharge, de placement ou d’opération inscrite au registre commun. Prendre le volant applique ce contrôle ; le débarquement conserve sa recherche physique et son accès existant. Le plein exige également d’être à pied.

`src/frontier-care.js` ajoute la vérification de la recharge et du contrôle manuel d’un poste à la transaction commune SAC & RELAIS. Elle couvre dépôt, coffre et relais sans changer leurs quantités ni capacités. Le refus depuis l’ancien bouton reste transactionnel ; après libération du poste, une seule unité passe et la reprise conserve ce transfert.

Chaque refus précède la mutation. Une tentative de crochetage déjà payée reste active et ne perd aucun contexte lorsqu’une manipulation est refusée. Son annulation garde le consommable engagé ; elle ne rembourse ni ne crée de stock. Une fois les mains libres, les mêmes transferts et le même plein fonctionnent, avec leur conservation exacte et leur reprise sauvegardée.

Aucun générateur, plan, ID, profil de véhicule, coût, vitesse, porte ni format de sauvegarde n’est modifié.

## Contrôle sans nouveau défaut

Le pansement régional sur un véritable palier a été vérifié : le bouton d’étage refuse déjà l’opération en cours ; PageUp interrompt déjà le pansement avant la montée. Le commandant monte sans recevoir de soin ni consommer les médicaments/rations. La descente et la reprise conservent les stocks. Ce comportement passe dans la 1.38 et la 1.39 (`world139-stairs-baseline138.json` / `world139-stairs-control.json`). Il n’a donc pas été refondu.

Les régressions 1.37–1.38 vérifient aussi les approches d’escaliers, paliers obstrués, anciennes positions bloquées, traversées de bâtiment, sorties D-17 sur quatre faces, retour de bus/camion, portières, épaves et collisions orientées d’annexe.

## Vérification

- `node --test --test-reporter=tap tests/world139.test.cjs tests/world138.test.cjs tests/world137.test.cjs tests/frontier.test.cjs`
- `node --test --test-reporter=tap tests/supplies118.test.cjs`

Les sept nouveaux scénarios sont dans `scripts/qa139-world.cjs`, enveloppés par `tests/world139.test.cjs`. Chaque cas de refus teste également la reprise légale de l’action et la sauvegarde. Les résultats de cette passe sont sous `reports/1.39.0/`.

Résultats : **6/6 scénarios de première passe réussis** (`world139-final.tap`), puis contrôle du transfert depuis le mirador vérifié séparément (`world139-mounted-final.tap`), **22/22 contrôles historiques SAC & RELAIS réussis** (`world139-supplies-summary.json`). La comparaison isolée avec 1.38 produit les cinq échecs attendus ; le contrôle de pansement/escalier passe déjà dans cette version. Une première passe de 43 régressions a passé 42 cas ; le seul échec concernait l’ancienne trace attendue du peintre de coffre dans le scénario 1.37, mise à jour dans le lot visuel 1.39 puis revérifiée séparément.

Ces scénarios exécutent les contrôleurs réels sous DOM simulé. Ils ne certifient pas l’affichage CSS, le tactile matériel, l’audio ou les FPS d’un navigateur.
