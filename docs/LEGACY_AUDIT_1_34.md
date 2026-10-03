# Audit des systèmes historiques — 1.34

Périmètre : ordre de chargement public, contrôleurs enveloppés, sources d'inventaire, mort et relève, alimentation électrique, commandes et transactions de nouvelle campagne. L'audit ne supprime pas les modules qui possèdent encore un usage réel ou une migration de sauvegarde.

## Défauts reproduits et corrigés

### Micro-réseaux des annexes : affichage et alimentation divergents

`world-evolution.js` ajoutait la puissance d'une annexe uniquement après l'allocation électrique. Avec le centre (8 unités), une annexe (4) et quatre projecteurs (12 de demande), le HUD pouvait annoncer 12/12 alors qu'un projecteur restait éteint. Le tick suivant repartait de 8, car le réseau ignorait les annexes. La réserve électrique ignorait également ce surplus.

La puissance des annexes achevées est maintenant une entrée du planificateur `power-grid.js`, en prévisualisation comme en simulation. `world-evolution.js` conserve ses effets logement et stockage, sans ajouter une deuxième fois la puissance. Les chantiers ne produisent rien. La nouvelle campagne ne conserve pas cette puissance.

Test de conservation : avec trois projecteurs et une annexe, le surplus réel de 3 unités charge une batterie de 2,7 unités-seconde par seconde (rendement existant de 90 %), sans création au rafraîchissement de l'interface.

### Anciens contrôleurs de nouvelle partie : effacement après refus

Plusieurs contrôleurs réinitialisaient leurs registres même quand le moteur refusait une graine ou un scénario invalide. L'enveloppe 1.27 protégeait déjà le parcours public actuel, mais les contrôleurs historiques restaient destructifs lorsqu'ils étaient utilisés indépendamment.

Les contrôleurs du terrain régional, des annexes, des kits essentiels, de l'atlas, des provisions, des aménagements et des lampes ne réinitialisent plus la campagne si aucun monde n'a effectivement été remplacé. Pour l'éclairage, l'état vierge reste préparé avant la première sauvegarde automatique puis est restauré si la demande échoue.

## Systèmes conservés et propriétaires des données

| Système | Propriétaire actuel | Compatibilité conservée |
| --- | --- | --- |
| Stocks et sac | Ressources du moteur, `player.carry`, coffre réel du véhicule | L'inventaire 1.29 organise ces stocks, sans quantités parallèles. |
| Sac de décès, armes, chargeurs | `succession133` et matériel personnel 1.31 | Relève sans réanimation automatique de l'ancien commandant. |
| Réseau de D-17, batteries, circuits | `power-grid` avec apport des annexes | Les modes historiques sont des consignes du même réseau. |
| Modules techniques à rapporter | `essentials` | Dépose, transport et recettes de kits ; ce n'est pas le nouveau circuit électrique d'un lieu régional. |
| Réparation des enceintes | Moteur, ingénieurs, caisses de réfection finies | Pas une deuxième barre d'intégrité ; matériaux réservés et coûts restent distincts. |
| Ancien inventaire 1.25 | Point d'entrée délégué à `loadoutUI` lorsqu'il est installé | L'ancien panneau sert au mode de compatibilité, sans deuxième inventaire actif. |
| Plans des anciennes campagnes | Révision de géométrie de la sauvegarde | Ils restent rechargeables ; aucun remplacement forcé des lieux visités. |

## Vérifications effectuées

`tests/legacy-audit134.test.cjs` couvre les apports électriques, la conservation d'énergie, les chantiers, la nouvelle campagne et deux refus de démarrage avec conservation des registres. Ces tests, ceux du réseau électrique, des annexes et de l'intégrité 1.26 ont passé ensemble : **57 tests, aucun échec** au contrôle ciblé.

Ces contrôles de simulation ne constituent pas une mesure de FPS ni une certification du rendu navigateur. La validation générale de la version assemblée est consignée dans le rapport de livraison.

## Relecture croisée des extensions 1.34

Les défauts suivants ont été reproduits puis corrigés avec les auteurs des modules :

- **Anciennes dépouilles 1.33** : récupération des armes sous forme d'objets réels du harnais, avec leurs cartouches. Un harnais trop lourd laisse le reliquat sur place ; l'ancienne boucle de réquisition ne peut plus contourner cette limite. Les seules cartouches restantes, sans arme, deviennent des munitions transportables avec le coût historique par cartouche (deux unités par cartouche de fusil à pompe).
- **Sauvegarde de l'armurerie** : refus avant remplacement du monde si un sac d'armes vise une dépouille absente, si le chargeur actif diffère de l'objet équipé ou si les familles possédées diffèrent du harnais. La reprise ne réinjecte pas les anciens chargeurs dans chaque arme.
- **Inventaire existant** : les cartes montrent désormais les instances réellement portées, leurs noms, chargeurs et états. L'emplacement « En main » n'affiche plus un pistolet permanent. La masse du harnais rejoint le total porté. Équiper depuis l'inventaire en pause utilise la même armurerie, sans nouvelle copie d'objet.
- **Entretien historique** : le nettoyage procure toujours huit rechargements accélérés pour une famille d'armes. Le libellé distingue ce bonus de la réparation d'usure ; cette préparation exige une arme à feu réellement en main.
- **Interventions** : un ordre de révision ne peut pas transformer une caisse ou un tableau en générateur ; les survivants réanimés sont inclus dans l'exclusion de danger. La géométrie des appareils est mise en cache au lieu d'être résolue pour chaque source à chaque appel.
- **Barricades** : la vérification d'occupation utilise la position réelle du joueur, des compagnons et des véhicules ; elle ne place plus fictivement le joueur au centre du passage. Le rendu local rejoint le vrai dispatch de profondeur. La cadence des attaques de hordes régionales conserve son délai entre les images.

`tests/arsenal-legacy134.test.cjs` : **7 tests réussis**, dont migration des anciens cadavres, harnais plein, cartouches seules, cohérence transactionnelle et équipement depuis la modale. Les **24 tests existants de l'inventaire** ont également passé après le raccordement visuel et fonctionnel.
