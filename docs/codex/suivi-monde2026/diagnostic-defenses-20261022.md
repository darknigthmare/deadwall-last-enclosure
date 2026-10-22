# Diagnostic défenses148 — 22 octobre 2026

## Cause confirmée

Le contrôle CI du job `119772489893` (run `39763290956`, code `7ec448a`) échoue à l’assertion du râtelier : l’atelier ne doit pas permettre un retrait distant au dépôt. Le jeu autorise le retrait parce que le point réellement choisi par la fixture se trouve dans la portée physique du dépôt. L’UI applique correctement `arsenal134.view().atHome`.

Le probe natif charge le produit actuel via `bootDocument134` et substitue **seulement** le module de fixtures : version exacte de `main` (`74a62084e96dd7e78463bd4e15b9ec2897887704`), version actuelle, puis proposition temporaire. Il ne s’agit pas d’un rejeu complet du produit de main.

| Fixture | Atelier grille | Accès depuis le plan maintenance | Distance au corps du dépôt | Retrait natif | Nœuds conservés |
|---|---|---|---:|---|---|
| Main | (58, 68) | (1864, 2149) | 125,575 | Refusé | Non |
| Actuelle | (60, 68) | (1928, 2149) | 67,119 | Autorisé | Oui |
| Proposition | (60, 68) | (1893, 2184) | 116,039 | Refusé | Oui |

La règle `home()` de `src/arsenal134.js` utilise `g.workerCanWorkAt(g.player, g.core(), C.Arsenal134Rules.homeReach)` avec une portée de 105, sous les préconditions ordinaires de vie, pied et région locale. Elle ne reconnaît que le dépôt central pour le râtelier ; les entrepôts servent à un autre flux de matériaux. Le point proposé est également éloigné de l’entrepôt existant (301,505 unités du corps ; accès natif refusé).

Le filtre de marge de six unités conserve les nœuds finis mais change l’atelier retenu. Revenir à l’ancienne sélection casserait cette préservation. Depuis la position initiale, même l’ancien atelier pouvait choisir un accès dans la portée du dépôt ; l’assertion historique dépendait donc implicitement du côté d’arrivée depuis le chantier. La régression actuelle de cette scène est imputable au déplacement de l’atelier, et non à une nouvelle règle d’armurerie.

## Proposition minimale, non appliquée

`fix.patch` ne touche qu’à la fixture de service et ajoute un test au fichier natif existant. La création du camp reste inchangée : mêmes bâtiments, emprises légales, filtres de ressources et montants préparés.

Pour le seul atelier, la fixture essaie d’abord son accès habituel, puis appelle le propriétaire natif `fieldcraft.service` depuis les quatre coins de l’emprise. Les coins ne sont que des origines de recherche, jamais des positions appliquées au joueur. Elle conserve un vrai point de service pour lequel `workerCanWorkAt` accepte l’atelier et refuse le dépôt avec la portée du jeu. La restauration est suivie d’une postcondition `arsenal134.view().atHome === false` ; aucun seuil de distance ni état armurerie n’est fabriqué. Le rapport de fixture expose explicitement `depotWithdrawalAllowed` et décrit cette préparation.

Le navigateur garde intégralement son assertion, ses actions DOM, ses temps RAF, son financement des deux plans et ses fabrications payées. Le runner temporaire ne change que ses deux chemins d’import : harness du dépôt et fixture corrigée dans `/tmp`.

## Validation

La nouvelle régression échoue avec la fixture actuelle exactement sur l’accès au dépôt (`true !== false`). La version proposée teste les approches initiale, depuis le dépôt et depuis le plan maintenance, la fabrication avec paiement final exact, le refus de transfert du véritable objet payé à l’atelier, puis son retrait effectif au dépôt. Elle contrôle aussi nœuds, RNG, identité, stocks et possessions.

Le fichier natif complet passe **6/6 tests**, zéro échec, en 135,883 secondes (`native-corrected.log`). La copie testant seulement la nouvelle régression contre la fixture actuelle échoue comme attendu, exit 1 (`native-current.log`). Le lancement demandé des trois profils navigateur s’est interrompu sur desktop lors d’un rechargement Save/Continue, avec `page.waitForFunction: Target crashed`. Les 22 contrôles natifs et 64 contrôles avancés terminés passent, y compris le retrait distant, les fabrications réelles, les paiements et les pièges. Les quatre collecteurs d’erreurs sont vides. La suite s’arrête au premier profil incomplet : les deux profils mobiles n’ont pas été exécutés et desktop n’est pas validé intégralement. La mesure mémoire postérieure au crash montre un plafond de 8 GiB et trois destructions OOM cumulées, sans compteur préalable permettant d’attribuer formellement ce crash à un OOM. Les relances sont différées pendant la vérification globale concurrente. Une vérification octet pour octet confirme que le runner navigateur diffère de la source du dépôt uniquement par ses deux chemins d’import ; profils et assertions sont inchangés.

## Traces et limites

- `probe-access.json` et `probe-corrected.json` : observations exactes du harness natif ; leurs scripts sont conservés à côté.
- `fix.patch` : diff non appliqué de fixture et test, avec chemins repo usuels.
- `fixtures-corrected.mjs` : source exacte exécutée.
- `browser-defenses148.mjs` : runner existant, seuls imports rendus absolus.
- `defenses-qa148.proposed.test.cjs` : futur fichier repo éventuel ; `corrected/current` sont des copies avec chemins absolus pour l’exécution isolée.
- `provenance.json` : empreintes SHA-256 des sources, copies, scripts, rapports natifs et patch.

Les chemins absolus sont une trace de l’environnement d’exécution, pas un outil portable à livrer à l’utilisateur. Les quotes d’artisanat du probe descriptif ont été lues sous un overlay de pause et ne prouvent pas l’éligibilité ; le test natif dédié et le runner navigateur non modifié vérifient la fabrication effective. Chromium local ne qualifie pas Windows ni Electron. Aucun fichier du dépôt, test existant, code produit ou générateur n’a été modifié pendant cette préparation.

## Résultat final du navigateur

- desktop: incomplet, arrêt par erreur, 22 contrôles natifs et 64 contrôles de scène.

Version Chromium : `153.0.8010.0`. Surface : `http://127.0.0.1:33397/?tools=1&fixture=legacy`. Aucun rejeu Windows/Electron. Le rapport brut est conservé sans modification.

## Archive et intégrité

`diagnostic-defenses-artefacts-20261022.tar.gz` contient les sources exactes, les deux probes, le patch non appliqué, les journaux natifs et le rapport navigateur brut. Les chemins des artefacts et leurs SHA-256 sont dans `diagnostic-defenses-20261022.json`. Gzip mtime 0, nom de fichier d’en-tête vide ; entrées tar mtime/uid/gid 0, mode 0644. Décompression et chaque empreinte sont vérifiées après écriture. Les captures mentionnées par le rapport brut restent des sorties temporaires et ne sont pas incluses dans cette archive compacte.

SHA-256 archive compressée : `784ad12f6f1c9f29e509263c8a3c2d9859c3b17bf37baeb260d790aaab3a347a`. SHA-256 tar brut : `434ba5633de3f5c5c0c2135a8aee329c5dbe35d5651932f339aeeb6664dc6ae4`.
