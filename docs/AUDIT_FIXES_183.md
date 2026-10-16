# Maintenance de DEADWALL 1.65.0 — audit du 16 octobre 2026

Base de travail : `1314e2c1d67f23c05cdd4bd53943fe97c6f56d9a`. Cette passe ne change ni les règles de coût, ni les âges, ni les cartes, ni le format de sauvegarde. Le suffixe technique 183 ne désigne pas une version commerciale 1.83.

## Corrections

La représentation FPS applique désormais l'orientation autour du centre de chaque humanoïde. La marche suit les déplacements effectivement observés, reste immobile à l'arrêt et respecte la réduction des animations. Les répétitions de rendu à temps identique sont stables. Le suivi est transitoire, par identité d'objet ; une restauration ou une interruption d'observation ne transporte pas une ancienne démarche dans la nouvelle scène.

Les volumes stables (solides, dalles, modules, garde-corps et ressources naturelles) sont tessellés et transférés uniquement lorsque leurs coordonnées, dimensions ou teintes changent. Déplétion, portes, dépose et destruction sont donc réévaluées sans dépendre d'un compteur de révision manquant. Les buffers typés et GPU grandissent au besoin et sont réutilisés ; les rayons et la visibilité partagent la géométrie du même dessin. Les acteurs des passerelles sont indexés une fois par dessin plutôt que reparcourus pour chaque liaison. Aucun gain de FPS sur matériel physique n'est revendiqué.

Le clic droit FPS vise sans tirer ; seuls le bouton principal ou le déclencheur explicite ouvrent le feu. Les annulations de pointeurs étrangers ne relâchent plus le doigt propriétaire du tir. Les commandes restent neutralisées en pause, après perte de focus, décès ou sortie d'affût. La barre de citadelle classique rejoint le flux du HUD ; seule sa version FPS reste flottante. Un travail temporisé masque seulement l'indication de touche redondante, pas ses vraies commandes ni les alertes tactiques.

## Livraison : correction du diagnostic d'audit

L'écologie et l'hydrologie n'étaient pas absentes : 32 modules sont concaténés dans `codex3000-live-data.js` par le compilateur. Leur ordre est désormais explicite dans `scripts/public-manifest183.cjs`, avec refus d'un bundle périmé ou d'une seconde inclusion. Le résultat compilé reste identique pour les mêmes sources. Le build et le serveur partagent les entrées de `index.html` au lieu de recopier une longue liste. Le serveur garde ses règles de chemins, types de fichiers et liens symboliques ; les modules de compilation ne deviennent pas publics.

La CI navigateur utilise le dossier construit. Une suite distincte vérifie ce dossier par le vrai menu, une nouvelle campagne, les fournisseurs intégrés, la sauvegarde/reprise et trois dispositions, puis par un scénario vertical avancé explicitement préparé. Les suites balance, quality et world-art sont ajoutées à la matrice principale. La limite native passe de 60 à 90 minutes sans retirer de test ni affaiblir le reçu d'endurance ; les exécutions périmées d'une même branche sont annulables par concurrence.

## Vérification et limites

Commandes ciblées : `node --test tests/audit183-*.test.cjs`, `npm run build`, `DEADWALL_QA_ROOT=dist node scripts/browser-audit183.mjs`, `DEADWALL_QA_ROOT=dist node scripts/qa-vertical175.mjs`. Le contrôle global reste `DEADWALL_SOAK=1 npm run check`.

Les résultats de chaque exécution et son commit sont consignés dans la PR et les artefacts CI. Les contrôles DOM simulés ne sont pas des captures navigateur. Les scènes verticales préparées ne constituent pas une progression gagnée naturellement. Une CI en cours ne vaut pas validation et ne déclenche ici aucune fusion ni publication manuelle.

Restent des chantiers distincts : refonte artistique complète de la vue FPS, escaliers et cabines librement parcourables, économie aquatique/chasse, vie civile individualisée, multijoueur autoritaire, complétion de tous les programmes, campagnes humaines longues et qualification des appareils physiques. Cette maintenance ne les annonce pas livrés.
