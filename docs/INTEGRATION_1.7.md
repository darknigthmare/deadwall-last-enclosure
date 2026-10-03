# Intégration 1.7 — preuves et limites

## Base effectivement récupérée

Archive du dépôt au commit c1db812e2ddf81b3f9a9926362a7ba13b32dbb65 : 6 063 064 octets, SHA-256 `1fa1da9d7a53e2511542c455ed382914f09223cd643caea9815798be5211e3aa`.

Kit cumulatif 1.6 : 14 100 741 octets, SHA-256 `fc93109e3b130a5e3554b8cc8ae7f6107cc69bdb0cc7d5698d8173af15953c31`.

L'installateur 1.6 a effectivement appliqué 49 fichiers au dépôt complet. Son reçu est conservé sous `docs/provenance/` à titre d'historique, pas comme reçu valide pour réappliquer un patch à la 1.7.

## Changements de production

- `scenarios.js` utilise la durée de préparation de Dayworks pour ses aperçus : les douze couples de scénario et difficulté correspondent au temps de la nouvelle partie.
- `coordination.js` produit six observations dérivées des structures, ressources, équipes et incendies ; aucune récompense et aucun ordre ne sont déclenchés à la lecture.
- `coordination-ui.js` regroupe les ordres secondaires, conserve les boutons existants et ajoute recherche et filtres au catalogue. Les onze dossiers de terrain restent exclusifs : un seul panneau visible.
- Le catalogue graphique déclare les 18 peintres procéduraux des extensions, distincts des atlas. Chaque peintre a été exécuté et a produit des pixels dans le navigateur réel.
- Le stockage refusé et les états de campagne invalides sont distingués. Une validation refusée préserve la sauvegarde principale et la copie de secours.
- Liste publique, cache PWA, build autonome, version et métadonnées actualisés. Aucun fichier QA privé n'est inclus dans `dist`.

## Tests historiques adaptés, et non 268 bugs de gameplay

Le premier `npm run check` de la pile 1.6 assemblée donnait 497 succès et 268 échecs (un test optionnel ignoré). 265 échecs avaient la même origine : le DOM factice des tests ne possédait pas `document.head` et laissait les interfaces ajoutées se monter trop tôt.

Le banc logique simule maintenant le chargement du DOM et les propriétés ordinaires des événements de pointeur. Les montages d'interface sont vérifiés séparément dans Chromium. Des attentes devenues obsolètes ont été corrigées : version de sauvegarde, durée du calme, version du cache, présence de peintres procéduraux. Les empreintes historiques de terrain et de ressources sont préservées en isolant la seule durée volontairement modifiée. Les fixtures de migration représentent de vraies anciennes versions, pas un état v8 modifié en contradiction avec ses compteurs de nuit.

Les premiers essais navigateur et leurs erreurs de mise en place sont conservés. Par exemple, une réserve territoriale ne peut pas contenir un stock récupéré sans soustraire ce stock de la réserve : le validateur l'a correctement refusé. Le scénario de stress repart d'une campagne propre avant de choisir la vague 100, au lieu de conserver le bilan incompatible d'une autre nuit.

## Résultats

Environnement d'exécution : Node 22.16.0, Playwright 1.63.0, Chromium 149.0.7827.55 sous Linux. Les outils de navigateur n'utilisent pas un moteur simulé : ils chargent le serveur du projet ou le vrai HTML autonome avec les atlas.

- Suite Node avec endurance activée : 775 tests réussis, 0 échec, 0 ignoré.
- Quatre parcours Chromium en parallèle : 64 contrôles réussis, 0 échec.
- Distribution et hors ligne : 8 contrôles réussis, 0 échec. Installation du service worker, rechargement hors ligne, HTML sans serveur, export JSON, refus d'import invalide et transfert confirmé entre distributions.

Quatre politiques scriptées de dix minutes sont aussi exécutées par la suite Node avec les règles réelles, sans construction gratuite ou élimination injectée : les quatre départs Standard de la graine 17117 atteignent l'horizon de 600 secondes. Ces politiques atteignent la vague 2 et ne certifient pas les nuits tardives.

L'endurance technique distincte utilise deux scénarios de 900 secondes et un robot d'assistance qui retire certaines menaces pour atteindre l'horizon. Ses compteurs d'éliminations synthétiques restent dans le journal ; ce n'est ni une campagne humaine ni une mesure de FPS. Le plafond de 720 infectés est exercé dans des situations préparées.

## Limites

Le navigateur est piloté avec un pas de simulation contrôlé, pas avec un joueur humain. Les cas avancés préparent une cité, un stock, un contact ou une vague pour tester la mécanique concernée ; ils ne sont pas présentés comme gagnés par une partie naturelle. Les captures sont issues du rendu du jeu ou de son interface, sans maquette.

La seule vérification du navigateur qui n'a pas abouti via sa CLI est `agent-browser`, qui perdait sa page entre deux commandes dans cet environnement. Les pages ont ensuite été vérifiées avec Playwright, avec URL, DOM, exceptions, ressources et images réellement chargées.

Pas de validation Safari/iOS, Firefox ou Electron empaqueté ; pas de mesure de fluidité garantie sur le matériel du joueur ; pas de validation exhaustive de toutes les sorties et de tous les quartiers sur plusieurs heures. Aucun push GitHub, changement de branche distante ou déploiement n'a été réalisé.
