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

Le lockfile inspecté contient 52 paquets hors racine : 36 MIT, 4 BSD-2-Clause, 2 Apache-2.0, 5 BlueOak-1.0.0 et 5 ISC ; aucune déclaration de licence manquante dans ces métadonnées. Cet inventaire est une lecture du lockfile, pas une inspection juridique exhaustive du code ou des binaires. Les versions directes ont aussi été rapprochées de leurs fichiers `LICENSE` installés.

Le paquet joueur est construit depuis un staging explicite sans `node_modules` : Packager et Fuses servent à fabriquer le programme, ils ne sont pas chargés par le jeu distribué. Le runtime Electron embarque en revanche Chromium et Node.js avec les notices mentionnées ci-dessus. Réviser cet inventaire à chaque changement de lockfile ou de runtime. Références : [Electron Packager](https://github.com/electron/packager), [sécurité Electron](https://www.electronjs.org/docs/latest/tutorial/security).

## Publication web et confidentialité de la livraison

Le build web utilise seulement Node.js et les fichiers locaux : `installCommand` est vide dans `vercel.json`. `.vercelignore` exclut des envois CLI les preuves QA, exports, archives PC, documentation et outils privés, tout en gardant `scripts/build.mjs`, les modules, images et styles nécessaires. La surface HTTP reste la liste explicite de `dist`, non les exclusions d'upload. Ne jamais placer un secret dans un fichier public ou déjà commité. Voir les [règles de fichiers ignorés Vercel](https://vercel.com/docs/builds/build-features).

Les tests Node vérifient le build sans dépendances, la cohérence du pré-cache PWA et la politique de fichiers PC/HTTP. Ils ne remplacent pas un essai réel de la PWA hors ligne ni les deux lancements du ZIP extrait après chaque livraison finale.

## Décisions encore nécessaires avant une mise en vente

- Définir et faire valider les conditions accordées aux joueurs, le canal de vente, l'identité éditoriale, l'assistance et les règles commerciales applicables aux territoires choisis. La licence source propriétaire actuelle n'est pas une fiche boutique ou un contrat joueur final.
- Le paquet Windows local est non signé : aucune identité Authenticode, installation signée, intégration boutique ou mise à jour automatique n'est revendiquée. Ne pas demander de désactiver SmartScreen ou l'antivirus. La [distribution Electron](https://www.electronjs.org/docs/latest/tutorial/distribution-overview) distingue packaging, signature et publication.
- Examiner les classifications de contenu et obligations éventuellement applicables à la boutique/aux territoires retenus ; aucune classification d'âge officielle n'est obtenue dans ce dépôt.
- Compléter les essais matériels, longues sessions humaines, accessibilité, lisibilité, audio et équilibre ; les scénarios injectant ressources ou ennemis ne constituent pas une campagne jouée normalement.
- Maintenir le runtime et surveiller ses vulnérabilités. Un audit npm sans alerte ne certifie ni Chromium, ni tous les pilotes, ni l'absence de défaut dans le jeu.
