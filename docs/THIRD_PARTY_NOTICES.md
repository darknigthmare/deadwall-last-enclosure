# Distribution, composants tiers et points commerciaux ouverts

Cette note décrit un contrôle technique des fichiers et déclarations de licences. Elle ne remplace pas une revue juridique, une certification de boutique ou une autorisation du titulaire du jeu.

## Jeu et contenus originaux

`LICENSE.md` / `LICENCE_JEU.md` conserve la licence propriétaire de Darknigthmare. Cette licence ne remplace pas celles des composants tiers. Le dépôt conserve la provenance des visuels OpenAI dans `docs/GAME_ART_PROVENANCE.md` et `docs/CONTENT_ART_PROVENANCE.md` ; les sons de jeu sont synthétisés localement par Web Audio. Aucune autorisation générale de redistribution des sources du jeu n'est ajoutée par cette note.

## Runtime distribué avec Windows

| Fichier livré à côté de DEADWALL.exe | Contenu |
| --- | --- |
| `LICENSE` | Licence MIT et mentions de copyright d'Electron. |
| `LICENSES.chromium.html` | Notices des composants tiers du runtime Chromium/Electron, à conserver intégralement. |
| `LICENCE_JEU.md` | Licence du jeu, distincte des composants tiers. |
| `NOTICES_TIERS.md` | Présente note, pour identifier ces fichiers et les limites du contrôle. |

Le script de fabrication exige la présence non vide des deux notices du runtime et inscrit leur taille et SHA-256 dans `release-manifest.json`. Il ne les remplace pas par une simple étiquette « MIT ». La [licence officielle d'Electron 44.0.0](https://github.com/electron/electron/blob/v44.0.0/LICENSE) permet notamment la redistribution sous réserve de conserver ses mentions ; les composants tiers listés par Chromium gardent leurs propres licences et éventuelles conditions.

## Outils de développement

| Dépendance directe verrouillée | Version | Déclaration de licence inspectée |
| --- | --- | --- |
| `electron` | 44.0.0 | MIT |
| `@electron/packager` | 20.3.0 | BSD-2-Clause |
| `@electron/fuses` | 2.1.3 | MIT |
| `@napi-rs/canvas` | 0.1.100 | MIT |
| `playwright` | 1.62.1 | Apache-2.0 |
| `ws` (serveur coopératif facultatif) | 8.21.3 dans le lockfile ; plage source `^8.18.3` | MIT, fichier `LICENSE` installé |

Le lockfile de la version 1.42.0 contient 68 paquets hors racine, y compris les binaires optionnels Canvas destinés aux autres plateformes : 49 MIT, 4 BSD-2-Clause, 4 Apache-2.0, 5 BlueOak-1.0.0 et 5 ISC sont déclarés dans ses métadonnées. Une entrée, `ws`, n'y déclare pas de licence : son `package.json` et son fichier `LICENSE` réellement installés indiquent MIT. Cette différence est conservée explicitement ; aucune métadonnée de licence n'est inventée dans le lockfile. Les six dépendances directes ont un fichier `LICENSE` installé. Cet inventaire ne remplace pas une inspection juridique exhaustive des sources ou des binaires.

Les versions 1.43.0 et 1.44.0 conservent ces 68 paquets et leurs versions : seul le numéro de version du projet a changé dans le lockfile. L'inventaire et l'audit daté ci-dessous sont donc conservés avec leur date et leur portée ; aucun nouvel audit du runtime Electron n'est annoncé.

Le paquet joueur est construit depuis un staging explicite sans `node_modules` : Packager et Fuses servent à fabriquer le programme ; Canvas et Playwright servent aux contrôles Node et navigateur. Ils ne sont pas chargés par le jeu distribué. `ws` est utilisé seulement par le serveur coopératif séparé et facultatif ; ce serveur et ses dépendances ne sont pas intégrés aux livraisons locales joueur. Le runtime Electron embarque en revanche Chromium et Node.js avec les notices mentionnées ci-dessus. Réviser cet inventaire à chaque changement de lockfile ou de runtime. Références : [Electron Packager](https://github.com/electron/packager), [sécurité Electron](https://www.electronjs.org/docs/latest/tutorial/security), [Canvas](https://github.com/Brooooooklyn/canvas), [Playwright](https://github.com/microsoft/playwright), [ws](https://github.com/websockets/ws).

Le 2 octobre 2026, `npm audit --json` avec npm 11.9.0 signalait deux dépendances de développement à sévérité haute dans le lockfile importé 1.41 : `brace-expansion` 5.0.9 et `undici` 7.29.0. Le lockfile 1.42 remplace uniquement ces deux dépendances préexistantes par les corrections 5.0.12 et 7.29.1 ; l'override exact d'Undici évite de prendre une nouvelle version mineure durant cette consolidation. Les versions directes Electron et Packager restent inchangées. Le contrôle du lockfile corrigé rapporte zéro vulnérabilité npm connue. Réinstaller avec `npm ci --ignore-scripts` applique ces versions ; ce résultat ne certifie pas le runtime Chromium/Electron ni les assets ou le jeu. Les empreintes d'intégrité des paquets proviennent du registre officiel, sans désactivation de TLS ou de vérification. Avis concernés : [brace-expansion](https://github.com/advisories/GHSA-qhr7-859c-m2p7), [Undici](https://github.com/advisories/GHSA-w293-vg96-wgc3). Les rapports complets sont des preuves de validation conservées à part des archives joueur.

## Publication web et confidentialité de la livraison

Le build web utilise seulement Node.js et les fichiers locaux : `installCommand` est vide dans `vercel.json`. `.vercelignore` exclut des envois CLI les preuves QA, exports, archives PC, documentation et outils privés, tout en gardant `scripts/build.mjs`, les modules, images et styles nécessaires. La surface HTTP reste la liste explicite de `dist`, non les exclusions d'upload. Ne jamais placer un secret dans un fichier public ou déjà commité. Voir les [règles de fichiers ignorés Vercel](https://vercel.com/docs/builds/build-features).

Les tests Node vérifient le build sans dépendances, la cohérence du pré-cache PWA et la politique de fichiers PC/HTTP. Ils ne remplacent pas un essai réel de la PWA hors ligne ni les deux lancements du ZIP extrait après chaque livraison finale.

`npm run package:web` produit deux archives joueur séparées, PWA et HTML autonome, dans un nouveau dossier `release/web/build-*`. Elles incluent la licence propriétaire, cette notice, les documents et JSON de provenance des images, ainsi qu'un manifeste SHA-256 par fichier. Les sources de développement, tests, rapports, secrets et dépendances npm sont exclus. Le script vérifie les fichiers réellement compressés et leurs empreintes ; `npm run verify:web -- DOSSIER` refait ce contrôle. L'origine et le profil du navigateur restent déterminants pour retrouver une sauvegarde : exporter une campagne avant de changer de site, de navigateur ou de chemin. L'archive ne confère aucune autorisation supplémentaire de publication ou de vente.

`npm run package:source` crée séparément une archive de développement contenant les fichiers actuels suivis ou non ignorés par Git : sources, lockfile, tests, docs, codex et assets. Les builds et fichiers usuels de credentials sont explicitement exclus, et la fixture historique de sauvegarde requise par les tests est conservée. Les noms UTF-8 du codex gardent leurs accents et espaces ; traversées de dossiers, chemins absolus et liens sont refusés. Cette archive décrit le checkout courant, y compris ses modifications non commitées, sans modifier l'archive originale 1.41. Son manifeste couvre les octets réellement compressés. Les fabrications d'archives demandent un dépôt Git avec un commit pour consigner la provenance ; `.git` n'est jamais livré, et les commandes ordinaires de développement et de QA restent utilisables sur les sources extraites. Elle conserve la licence source propriétaire et n'autorise aucune redistribution publique supplémentaire.

## Décisions encore nécessaires avant une mise en vente

- Définir et faire valider les conditions accordées aux joueurs, le canal de vente, l'identité éditoriale, l'assistance et les règles commerciales applicables aux territoires choisis. La licence source propriétaire actuelle n'est pas une fiche boutique ou un contrat joueur final.
- Le paquet Windows local est non signé : aucune identité Authenticode, installation signée, intégration boutique ou mise à jour automatique n'est revendiquée. Ne pas demander de désactiver SmartScreen ou l'antivirus. La [distribution Electron](https://www.electronjs.org/docs/latest/tutorial/distribution-overview) distingue packaging, signature et publication.
- Examiner les classifications de contenu et obligations éventuellement applicables à la boutique/aux territoires retenus ; aucune classification d'âge officielle n'est obtenue dans ce dépôt.
- Compléter les essais matériels, longues sessions humaines, accessibilité, lisibilité, audio et équilibre ; les scénarios injectant ressources ou ennemis ne constituent pas une campagne jouée normalement.
- Maintenir le runtime et surveiller ses vulnérabilités. Un audit npm sans alerte ne certifie ni Chromium, ni tous les pilotes, ni l'absence de défaut dans le jeu.
