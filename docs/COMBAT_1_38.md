# Combat et recharge — 1.38

Cette passe poursuit la correction des systèmes existants. Elle ne change aucun des 37 profils d’armement, aucune statistique, aucun coût, aucun identifiant ni le format de sauvegarde.

## Défaut reproduit

Le bouton tactile **RECHARGER** pouvait lancer une recharge de 1,35 seconde pendant une révision de groupe électrogène déjà engagée. Le mini-jeu gardait sa tentative active et ses six ferrailles déjà consommées ; le commandant effectuait ainsi deux manipulations simultanées. La 1.37 avait bloqué plusieurs opérations lorsque la recharge était déjà en cours, mais cette entrée inverse restait ouverte.

`arsenal134.js` contrôle maintenant l’état de jeu actif, la conduite et le registre commun des occupations avant de transmettre une demande de recharge. Une action occupée refuse la recharge sans perdre ni interrompre la tentative payée. Le mécanisme de recharge active conserve sa seconde pression et sa fenêtre parfaite. Lorsque le travail est terminé, le même bouton permet une recharge normale.

## Vérification

`tests/combat138.test.cjs` charge tous les modules et commandes dans l’ordre du HTML livré grâce à `scripts/qa-startup134.cjs`. Ses trois scénarios vérifient :

1. Le refus de recharge par le vrai bouton tactile pendant une intervention, la conservation de la tentative payée, la réparation effective puis la recharge autorisée et reprise par sauvegarde.
2. Le refus pendant pause ou modale, puis une seconde pression dans la fenêtre parfaite : une seule cartouche est ajoutée et une seule unité de munition dépensée.
3. L’assemblage financé d’un fusil à deux coups, la recharge au coût existant de deux unités par cartouche, la cadence locale puis régionale, l’usure, une réparation financée sans ajout de cartouche, les changements de chargeur exacts, le refus de changer d’arme pendant recharge, et la reprise en région sans prélèvement distant au dépôt. Une unité de munition restante ne permet pas de créer une cartouche coûtant deux unités.

Le groupe endommagé est une structure préparée pour le test, placée avec la validation d’implantation réelle ; le commandant rejoint un point de service accessible. Les consommables sont retirés du dépôt par le système d’inventaire. Les travaux d’armurerie avancent par leur service pour isoler les coûts ; les recharges avancent par `Game.update`. L’arrivée préparée au bord de D-17 et son point régional sont contrôlés par les collisions existantes. Ces scènes ne sont pas présentées comme un trajet humain complet.

La commande `node --test tests/combat138.test.cjs tests/combat137.test.cjs tests/arsenal134.test.cjs tests/fieldcraft.test.cjs` termine avec **58 tests réussis, aucun échec**. Elle rejoue aussi les tests de l’armurerie, de la 1.37 et de l’artisanat de terrain. Les contrôles existants couvrent notamment les frappes, les postes, les pertes et récupérations d’armes. Le défaut de bouche de projectile locale et les transferts d’inventaire pendant recharge ont été transmis aux autres lots de cette livraison, sans modifier leurs propriétaires depuis ce lot.

Journaux : `reports/1.38.0/combat138-before.log` (échec reproduit avant correction) et `reports/1.38.0/combat138-targeted.log` (suite ciblée après correction). La vérification globale `npm run check` appartient au contrôle final de livraison.

## Compatibilité et limites

Aucun champ de sauvegarde, aucune géométrie G1–G6, aucun chargeur historique ni stock n’est migré. Les réparations de la 1.37 sont conservées. Les preuves reposent sur la simulation et le DOM de test ; elles ne certifient ni un écran tactile matériel, ni le rendu CSS dans un navigateur, ni les performances GPU, ni une campagne humaine complète.
