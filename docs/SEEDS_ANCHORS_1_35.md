# Cartes, graines et position de D-17 — 1.35

## Nouvelle campagne

Le champ de graine reste vide par défaut. Chaque nouvelle campagne tire alors une graine uint32, distincte de la campagne courante et du dernier tirage. `crypto.getRandomValues` est préféré ; les environnements hors ligne qui ne le fournissent pas, ou en refusent l’accès, disposent d’un repli local. Le contrôle anti-répétition reste actif même avec une horloge et une source d’entropie figées.

Un nombre saisi volontairement, une graine tirée puis affichée par le bouton existant, ou une graine reprise depuis les archives restent explicites et reproductibles. Le bouton **Aléatoire à chaque départ** efface ce choix. Le dossier de départ indique le mode du prochain départ et la graine réellement active. Une même graine reproduit la carte pour une même génération du monde ; elle ne synchronise pas toute la simulation de combat.

Le bouton **Carte D-17** ne remplit plus silencieusement le champ. Si celui-ci est vide, l’aperçu prépare une graine temporaire : le prochain départ accepté utilise cette carte, puis la consomme. Le départ suivant tire une nouvelle carte. Un départ refusé ne consomme pas cet aperçu et ne remplace pas la campagne. Le chargement d’une campagne conserve sa graine sauvegardée et abandonne l’aperçu temporaire.

## Consommateurs de l’ancrage régional

La position historique `(4096, 4096)` reste valide pour les campagnes antérieures. Les nouvelles générations obtiennent leur position depuis `DeadwallAtlasProjection.home(context)` ; les quatre jonctions proviennent de `gatesFor(context)`. Le contexte est la campagne ou le monde régional, sans état global mutable de projection.

Cette passe raccorde les systèmes suivants à ce contrat :

- les budgets aller/retour du ravitaillement et l’origine réelle du joueur local ;
- les tournées et recherches du carnet régional ;
- le choix des missions de campagne et des douze interventions essentielles proches du dépôt ;
- les chemins de retour locaux, leur projection régionale, les budgets véhicules et les lignes de guidage ;
- le découpage des voies régionales autour de l’emprise réelle de D-17.

Les coordonnées locales, rayons, stocks, coûts, durées et quantités sauvegardées ne sont pas déplacés. Les comparaisons utilisant la taille locale `4096` et les listes de noms/identifiants des quatre jonctions restent pertinentes ; seules leurs positions régionales dépendent de la graine.

## Vérifications ciblées

`tests/seed-start135.test.cjs` parcourt deux nouvelles campagnes depuis le menu, une graine explicite maximale, la sauvegarde/reprise, le retour volontaire à l’aléatoire, le refus d’un départ invalide et les replis d’entropie. `tests/maps129.test.cjs` clique sur le vrai contrôleur d’aperçu et vérifie son usage unique sans épingler le champ.

`tests/anchor-consumers135.test.cjs` vérifie que les voies évitent le dépôt déplacé et laissent l’ancienne position libre, puis déplace une région complète pour vérifier la conservation des douze objectifs essentiels et de leurs objets. Les anciennes suites de profils, départs, retours, ravitaillement, carnet régional, services et opérations restent exécutées. Ces contrôles simulent le DOM ; ils ne certifient pas la disposition CSS ou le débit d’images.

`tests/anchor-integration135.test.cjs` charge les scripts dans l’ordre HTML livré et contrôle deux campagnes G6 successives, les sorties et retours sur les quatre côtés avec sauvegarde/reprise, la caméra d’atlas et son bouton de jonction. Une reprise G5 conserve son ancienne génération et son emplacement historique.

`tests/biome-gameplay135.test.cjs` complète le raccord G6 : apparition d’un infecté récent avec son profil, projectile réel, conservation des blessures après reprise, refus d’une santé importée supérieure au profil et dégâts réels au contact. Un second scénario réalise le crochetage, la révision d’un groupe, le diagnostic du tableau et la construction d’une barricade sur la géométrie générée. Il vérifie les coûts, l’éclairage, la consommation de carburant, la distinction des niveaux et la persistance. Les préparations de rencontre et d’atelier sont explicitement identifiées dans le test ; les objets, ouvertures et ennemis proviennent du générateur réel. Les emprises des huit bâtiments de chaque annexe restent hors des voies, leur demi-largeur comprise.
