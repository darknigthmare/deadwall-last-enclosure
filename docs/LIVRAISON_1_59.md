# DEADWALL 1.59 — Livraison

Le jeu reçoit 32 nouveaux PNG, soit 496 dessins utilisés : actions compatibles avec les apparences de marche, composants mobiles de pièges et postes, équipements portés, dépouilles, sites d’expédition et matériaux d’intérieur. Les gestes et effets suivent une action réellement effectuée. Le Guide contient 4 615 fiches, dont 180 vrais choix D-17 ; ses liens de carte n’ouvrent que les lieux déjà repérés.

Les PNG originaux, prompts et empreintes se trouvent dans `assets/art159`. Les variantes restent déterministes. Cette passe conserve les générations G1 à G9, les ressources finies, les coûts et les formats de sauvegarde existants.

```sh
npm ci
npm start
DEADWALL_SOAK=1 npm run check
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:sprites
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:codex
```

Validation locale finale : **3 364/3 364 tests avec endurance**, code réel 0, aucune annulation/skip/TODO et sources inchangées. **1 235 contrôles navigateur** réussissent sur 24 contextes, sans erreur runtime/console/HTTP. Les 143 images chargent ; le serveur fournit les 328 fichiers publics aux octets attendus. Le script d’installation cloud a réussi trois fois ses 39 tests en réutilisant les dépendances conformes.

Les mêmes octets du HTML autonome réussissent les neuf contrôles en HTTP. Le lancement `file://` reste non qualifié dans ce cloud : Chromium le bloque par politique administrative avant chargement. Aucun contournement n’a été appliqué. Les appareils physiques, la fluidité, la cible Standard 6–10 heures et la version Windows exigent leurs propres preuves ; les 626 programmes Codex exclus restent explicitement signalés.

Depuis le commit propre, `npm run package:web` fabrique et vérifie les ZIP Web/PWA et standalone ; `npm run package:source` fabrique et vérifie le ZIP source. Les manifestes enregistrent le SHA du commit et les empreintes de tous les fichiers. Chaque construction préserve les anciens dossiers `release/*/build-*`. Les reçus de capture et vérification sont conservés dans `/workspace/deadwall-cloud/audit159`, avec les deux seules différences documentaires admises après le contrôle natif.

Git, CI Windows/Linux et HTTPS sont vérifiés séparément sur le SHA final. Le dernier refus Vercel antérieur (1.58, 13 octobre 2026 à 12:41 UTC) indique « Deployment rate limited — retry in 24 hours. » ; le site était encore 1.57.2. Ce document ne transforme pas un build local ou un statut ancien en preuve de publication 1.59.

Audit détaillé : [AUDIT_1_59.md](AUDIT_1_59.md).
