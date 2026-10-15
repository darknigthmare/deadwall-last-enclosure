# Passe 173 — travées, architecture native et infrastructures

Base examinée : `daaeaa7a582e5444fef7b9c7eb004ffe316b9076`, sources récupérées dans l’artefact GitHub 11780714212. Les 4 246 empreintes du manifeste ont été vérifiées. Les modules de réseaux non publiés 172 ont été repris puis renforcés ; cette archive antérieure ne contenait aucun fichier d’architecture.

## Livré dans la campagne : révision optionnelle 10

Au dépôt, **Monde & relais → COMPLÉTER LES TRAVÉES INTÉRIEURES**. Rayonnages, tables, comptoirs, manutention et machines au sol sont examinés après les couches 0–9. L’exploration des positions est bornée, déterministe et sans déplacement des anciennes présences. Les prescriptions de paroi restent des prescriptions de paroi. Les machines lourdes restent limitées aux usages compatibles au rez-de-chaussée.

Les faces de service et les anciens points atteignables sont préservés. Les rayonnages ont deux faces accessibles ; tables et machines quatre. Les tables emploient l’image sans assises intégrées, sans fabriquer une interaction pour s’asseoir. Collisions, lignes de vue et gabarits automobiles utilisent les nouveaux objets. Aucun stock, carburant ou branchement gratuit.

Sur la graine 17117 : 3 000 programmes classés, 2 374 compatibles et 2 951 étages comparés. **352 objets supplémentaires** (177 tables, 130 rayonnages, 32 machines, 13 comptoirs) ; **2 716 → 2 364 unités sous les minima auteur** ; 111 demandes de cette couche refusées pour l’espace ou l’accès. Plans, anciennes présences et butin sont comparés avant/après. Ce sont des occurrences de recettes avec variantes héritées, pas de nouveaux assets indépendants.

## Architecture native : laboratoire intégré au Codex, distinct de G8

Ouvrir une fiche et utiliser **ARCHITECTURE NATIVE ET RÉSEAUX — LABORATOIRE**. Le générateur construit les répétitions choisies dans les intervalles sources, conserve les niveaux demandés jusqu’à −2 / +8, relie les paliers d’escalier et place les espaces extérieurs hors du volume couvert. Les entrées des pièces sont réservées avant l’ameublement. Les jardins au sol ont une clôture ouverte sur une voie d’accès et des composants issus des profils existants. Les meubles utilisent les peintres et atlas du projet.

Audit structurel de 2 374 recettes : **10 548 pièces, 1 424 extérieurs, 3 012 plans de niveau, 638 liaisons d’escalier**. Chaque occurrence garde l’identifiant de son espace source. Les noms des variantes ne multiplient pas les architectures originales dans la provenance.

**618 parcelles reconstruites dépassent l’enveloppe maximale source.** Elles restent signalées pour une implantation à résoudre, et ne sont pas injectées dans G8. **6 574 affectations de niveau sont déduites** parce que les sources correspondantes n’en indiquent pas ; ce ne sont pas des niveaux attestés par les auteurs. Le laboratoire ne prétend ni valider une structure porteuse ni remplacer automatiquement un lieu sauvegardé.

## Réseaux électriques et circulation

Le circuit est lié aux pièces réellement présentes dans le modèle natif : une charge lumineuse par pièce, tableau par étage, liaisons verticales explicites. Groupe vide et éteint. Le banc possède une réserve séparée explicitement annoncée de trois unités pour ses essais ; elle ne vient jamais du dépôt ni du sac. Verser, mettre en marche, simuler dix secondes, mémoriser et reprendre passent par les transitions du modèle. La topologie exacte fait partie du registre : un état d’un autre circuit est refusé. Pas d’horloge en arrière-plan, pas de consommation pendant une pause implicite du banc.

Tunnel, échangeur à quatre bretelles et port utilisent les graphes 172 renforcés. Un acteur parcourt leurs segments en continu ; les largeurs, sens, niveaux, modes et fermetures sont contrôlés. Fermer une liaison arrête l’acteur sur place, sans téléportation ; une route terrestre n’accepte pas les bateaux. Les états sauvegardés sont validés contre les mêmes bornes et la même topologie.

**Ces trois ouvrages restent des scénarios d’essai**, pas des implantations de campagne. La côte du port est explicitement une côte du banc. Restent les raccords au terrain réel, réservations régionales, courbes carrossables, transitions de véhicule dans le moteur G8, interactions et sauvegarde de campagne. Les circuits du laboratoire n’alimentent pas les appareils historiques de G8.

## Vérification et reprise

Commandes : `npm run build`, `node --test --test-concurrency=1 tests/codex-packing173.test.cjs tests/codex-native173.test.cjs tests/site-infrastructure173.test.cjs tests/networks173.test.cjs tests/distribution.test.cjs`, `node scripts/audit-packing173.mjs`, `node scripts/audit-native173.mjs`, `node scripts/browser-parallel173.mjs`.

34 tests ciblés locaux passent, avec le build de 278 fichiers publics. Les nouveaux essais ont détecté puis corrigé un obstacle sur une entrée native et une limite de traversée trop courte au retour dans un tunnel. Le navigateur HTTP local est bloqué par la politique de l’environnement : ses trois profils restent signalés non exécutés jusqu’aux essais GitHub Actions avec les outils verrouillés. Les tests d’interface en mémoire sont des preuves séparées.

Ne pas attribuer les succès Windows ou endurance de la passe 171 à cette révision. Aucune fusion vers main ni publication de production n’est autorisée par cette livraison. Le mobilier intérieur restant, les terrains spécialisés et l’intégration des architectures natives restent des travaux distincts.

Vérification locale générale effectivement lancée : `npm run check`, interrompue après 180 secondes ; plusieurs fichiers ne peuvent charger `@napi-rs/canvas`. Aucune réussite globale revendiquée. Le test navigateur de campagne refuse localement la navigation HTTP (`ERR_BLOCKED_BY_ADMINISTRATOR`) sur les trois formats : zéro contrôle exécuté, pas une validation. Un essai distinct en DOM mémoire a ensuite réussi 24 contrôles (3 formats), avec rendu de secours et sans simulation de campagne. Deux défauts ont été corrigés avant livraison : accès aux pièces natifs bloqués par le mobilier, et arrêt prématuré d'une traversée multi-arcs de tunnel.
