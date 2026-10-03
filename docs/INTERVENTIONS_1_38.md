# Interventions et ouvertures — consolidation 1.38

Cette passe conserve les règles de `InterventionRules134` et `BarricadeRules134`, les identifiants des objets et ouvertures, ainsi que leurs registres de sauvegarde version 1.

## Défauts reproduits dans l’ordre de chargement livré

Les contrôles utilisent `bootDocument134()` de `scripts/qa-startup134.cjs` : scripts chargés selon `index.html`, DOM simulé et vraies géométries de campagne. Ce ne sont pas des captures navigateur ni une campagne humaine.

- Un infecté relevé à un mètre refusait une révision, mais le même groupe acceptait son ravitaillement puis son démarrage. Les fournitures pouvaient donc être manipulées malgré la menace que le panneau annonçait comme bloquante.
- Une barricade acceptait le début du travail pendant un rechargement, puis annulait au premier pas de simulation. Un placement de construction encore sélectionné présentait la même incohérence.
- À la fenêtre `local:station-1:window:broken-east`, graine 17117, un break de rayon local 22 garé à 30 unités, sur une position admise par `carClear()`, interdisait la pose. L’occupation utilisait un rectangle régional multiplié par 32 au lieu du gabarit local réel. Les camions des territoires, eux, manquaient à la liste des occupants.

## Comportement corrigé

Le ravitaillement et le démarrage d’un groupe révisé exigent la même sécurité que son diagnostic. Le refus conserve exactement le sac, le carburant du groupe, son état et son compteur d’essais. L’arrêt reste possible sous menace au contact du groupe : il ne transfère aucun consommable et permet de couper le bruit.

Rechargement et placement refusent une nouvelle intervention ou barricade immédiatement. Une session de diagnostic déjà payée s’interrompt si un rechargement, un placement ou une autre opération prend les mains. Son coût engagé reste consommé, comme lors d’une annulation ou d’un chargement ; aucun résultat partiel n’est créé.

L’occupation d’une ouverture locale consulte désormais les mêmes acteurs physiques que les autres emprises de D-17 : commandant, unités, infectés, véhicule de `expeditions.entity()` et convois de `territories.truckEntities()`. Le véhicule utilise son rayon fourni par son système propriétaire. Le rectangle en mètres reste utilisé en région. L’occupation est contrôlée à l’aperçu et pendant les travaux, avant le paiement final.

## Vérification des transactions existantes

`tests/interventions138.test.cjs` ajoute cinq parcours complets dans l’ordre HTML :

1. Révision régionale : 5 ferrailles ; refus de ravitaillement/démarrage sous menace sans débit ; transfert sûr de 4 carburants ; arrêt sous menace ; reprise exacte.
2. Début refusé pendant placement sans compteur ni dépense ; deux tentatives interrompues gardent exactement leurs 10 ferrailles engagées sans réparer gratuitement le groupe.
3. Groupe dans une cave et deux tableaux physiques de niveaux distincts : 5 + 3 + 3 ferrailles ; un étage reste éteint tant que son propre tableau n’est pas rétabli ; mauvais étage refusé ; pause sans consommation ; destruction du support coupe les deux distributions sans brûler de carburant supplémentaire.
4. Barricade locale : rechargement et placement refusés ; arrivée d’un occupant annule sans débit ; travail inachevé interrompu à la reprise ; travail terminé paie une seule fois 6 bois et 1 ferraille et conserve sa collision au chargement.
5. Break garé hors de l’ouverture accepté avec son vrai rayon ; véhicule ou camion dans l’ouverture refusé ; pose et reprise conservent ressources, gabarit et collision.

Les tests historiques de crochetage, réparation D-17, réserves scellées, erreurs, portée, étages, dégâts, démontage depuis les deux faces, cadence d’attaque et import transactionnel restent exécutés. Les journaux sont conservés dans `reports/1.38.0/interventions138-*.tap`.

Aucun coût, rendement, stock, statistique d’arme, forme régionale, format de sauvegarde ou générateur de carte n’est modifié. Aucun besoin d’illustration supplémentaire n’a été identifié dans ce lot : les tableaux et groupes contrôlés utilisent leurs représentations existantes.
