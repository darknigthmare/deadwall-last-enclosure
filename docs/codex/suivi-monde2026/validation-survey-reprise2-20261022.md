# Reconnaissance narrative — nouvelle qualification après restauration

**Sources :** `a137e2f714649083e460fcf25b0d84b7ea1bee57`, arbre `172bf1a43d4c7546853415f5d20c5a2592292252`.

**Résultat : 7/7 tests natifs, 16/16 contrôles Chromium Linux, codes de sortie 0. Le job CI Windows 119860247053 réussit également sur le même arbre Git.**

Ces résultats proviennent de nouvelles exécutions après la maintenance. Les anciens journaux locaux de 84 tests et 16 contrôles ont disparu ; ils ne sont ni recréés ni comptés dans cette preuve.

## Contrat et parcours observés

Dans la graine 17117, le centre du marché `(1767.75, 3062.87)` et son disque de 90 unités se trouvent dans `settlement-2-building-2`, d’emprise `(1566, 2957, 320, 256)`. Le résolveur conserve le secteur et dérive un point praticable `(1767.75, 2934.87)`, décalé de 128 unités. Les collisions restent actives.

Le parcours Chromium part du spawn réel `(2068, 2278)` : 29 cellules et 383 pas du moteur, puis un maintien réel de E pendant 8 061 ms sous la boucle RAF normale. Le relevé atteint huit secondes sans décision ni insight gratuits. Le retour passe par 30 cellules et 447 pas ; le journal refuse le choix à distance, puis applique le coût existant exactement une fois au dépôt. Sauvegarder, recharger et Continuer conservent les champs persistés normalisés, dont RNG, stocks et récit ; le harnais partagé exclut uniquement `timestamp` et `wavePlan`.

Le script de trajet maintient les entrées directionnelles et appelle `Game.update` par pas bornés. Temps, collisions, acteurs et économie suivent leurs propriétaires ordinaires. Ce contrôle ne mesure pas une campagne humaine en temps réel.

## Deux profils distincts

| Profil | Contrôles | Résultat | Portée |
|---|---:|---|---|
| native-walk | 10/10 | Réussi | Entrée joueur G10/R4, repère, trajet, E huit secondes, retour, paiement, Continuer |
| exact-desktop-narrative | 6/6 | Réussi | Bloc narratif extrait sans changement de `desktop/smoke.cjs`, paramètres `stage` et `expectedNarrative` seulement |

Le deuxième profil conserve les relocalisations contrôlées et les pas natifs du smoke existant. Il ne constitue pas une deuxième preuve de déplacement. Il maintient toutes les assertions du bloc : marché partiel à deux secondes, logement achevé, choix payé unique et état lu restauré.

Le rapport final couvre 2026-10-22T14:04:01.587Z à 2026-10-22T14:05:06.296Z (64,709.000 ms). Aucun collecteur page, console, HTTP ou requêtes ne relève d’erreur. Les empreintes des sources, du runner et de l’intégralité du build servi concordent avant et après. Les deux contextes, le navigateur et le serveur sont fermés ; aucun processus `/tmp/chromium` ne reste au contrôle de fin.

## Première tentative conservée

La première tentative termine avec le code 1. Le runner cherchait le bouton Journal dans une section Situation repliée et s’arrête avant le déplacement sur un timeout Playwright. Deux contrôles initiaux du trajet et six du bloc smoke réussissent, mais cette tentative ne qualifie pas le parcours complet. Le correctif concerne uniquement le runner temporaire : Pause → Poste de commandement → Journal, puis Reprendre à la sortie. Les sources du jeu et les assertions restent intactes. Rapport, script, journal et capture de cette tentative sont archivés séparément.

## Preuve Windows indépendante

Le run CI `39789163177`, job Windows `119860247053`, conclut `success`. Le journal annonce à `13:48:52.0038174Z` deux lancements du portable, ainsi que la conservation du relevé partiel, du choix unique et de l’état lu. Le checkout CI est le merge synthétique `f0513f67f234c4ff651ec09f232ae0c9f174a378`. L’agent coordinateur a vérifié ses objets GitHub : son arbre `172bf1a43d4c7546853415f5d20c5a2592292252` est celui du checkpoint local.

Cette preuve native Windows est distincte du probe Chromium Linux. Les octets PWA Windows diffèrent avec CRLF ; leur empreinte n’est pas assimilée au manifeste du build Linux. Aucun gros artefact Windows n’a été téléchargé et aucun Windows local n’a été rejoué par cet agent.

## Artefacts et intégrité

Le résumé structuré [validation-survey-reprise2-20261022.json](validation-survey-reprise2-20261022.json) contient les empreintes brutes et compressées, les sources avant/après, les compteurs, les mesures de trajet et les limites. Tous les gzip ont un horodatage interne nul (`mtime=0`). Les noms bruts décrivent le contenu décompressé. Les chemins absolus présents dans les rapports et scripts sont des traces de cet environnement d’exécution ; le runner archivé n’est pas un outil utilisateur portable.

| Artefact | SHA-256 du fichier fourni | SHA-256 du contenu brut |
|---|---|---|
| [validation-survey-reprise2-20261022.browser-report.json.gz](validation-survey-reprise2-20261022.browser-report.json.gz) | `985774a9855dd8be7ad061235a53f435e2694fa7f636b873ebe9c1958cf6d439` | `14467ed2787fb727e1b78287fcd585c0fa6f4cdf56b7e71ea42301c5578fc7e7` |
| [validation-survey-reprise2-20261022.browser-runner.mjs.gz](validation-survey-reprise2-20261022.browser-runner.mjs.gz) | `77c8b432175c4a5a659d3cea587c515ba9d0999860158e3d9b25ab1f5ebeaee6` | `f2a14208d064af283cabf268f9a7868f897e59cc6e0c36acd94a1533e7f78f8f` |
| [validation-survey-reprise2-20261022.browser.log.gz](validation-survey-reprise2-20261022.browser.log.gz) | `cd1003d24661f877ef348854df7053c50c6b4f835cd15474853502f7e0af2669` | `213ffda4704602e6fff8059aea65f4a3ff63bdeb3972ae246796b1b5f1dbf7bd` |
| [validation-survey-reprise2-20261022.native.json.gz](validation-survey-reprise2-20261022.native.json.gz) | `d41185573b59438c7ea1b63715135b624c914455709727860261a6e07833e8ab` | `9a9a17bb2255d9b30c7a74d5e12e386c06bc9efa46cd2dc2b0ee02459e1013e5` |
| [validation-survey-reprise2-20261022.native.log.gz](validation-survey-reprise2-20261022.native.log.gz) | `2bb1b0f2dc79bcbc961e116bcc61fd47002102d91e437a0e24f1a528a2a2804a` | `c68b51d9a7260107bb9d1920d5db276dbbf4a61076ba056dd235eb72f5ac7f2b` |
| [validation-survey-reprise2-20261022.smoke-template.txt.gz](validation-survey-reprise2-20261022.smoke-template.txt.gz) | `c95cd87731c9c1a0ffca7d0d8acd6147ab2f84517a7f68209e15f5b7dbaf26ba` | `464048e77bf1d9bb4d82f6cacc6e9c497286b1f45235207ed38da96be16d0ca8` |
| [validation-survey-reprise2-20261022.attempt1-report.json.gz](validation-survey-reprise2-20261022.attempt1-report.json.gz) | `b1c5991b5ad18922828cf587740e4fc558f946eab56f60df47ebb33565356771` | `37d9ef963551530edd2065ae8df8485564177c89a591f051fee1eec0d2aa242e` |
| [validation-survey-reprise2-20261022.attempt1-runner.mjs.gz](validation-survey-reprise2-20261022.attempt1-runner.mjs.gz) | `fd9010bfa0a87db4ac9a8d5b5520693cd45ba7197214da376f09eecb2a4c7417` | `8163cb6d39072922f8ccc368c75af520559e4481529ab658780df12797defc41` |
| [validation-survey-reprise2-20261022.attempt1.log.gz](validation-survey-reprise2-20261022.attempt1.log.gz) | `c337d09752651fe80e75975e28f76b27cad17e65bab2fcf4355d98ab7d11075a` | `03644aee3e4573312fade3b4629122acae76ec90663562d9373d0e658df5135a` |
| [validation-survey-reprise2-20261022.attempt1-diagnostic.json.gz](validation-survey-reprise2-20261022.attempt1-diagnostic.json.gz) | `372246c8b4039e0c7e6ffb572ebda40c53bb5c5d2c396cf4882f97c70909b469` | `e9dc2158a0948482d41985f40f5f51f35154b811e8e8b41a63b5ff6c66a88899` |
| [validation-survey-reprise2-20261022.windows-ci.log.gz](validation-survey-reprise2-20261022.windows-ci.log.gz) | `22e4a86bc517495fcc50dca123f6eefcdf9880e04a0ea4bce36eaf4821677fe1` | `16d26c74c101088bf011d9b2f9f4acac8bceb3b06bcc45947b7a383483c3b03c` |
| [validation-survey-reprise2-20261022.market-releve.png](validation-survey-reprise2-20261022.market-releve.png) | `f4693b2d573706c4e077d6c93503a5ddd7ee7b0a643196ef5f4c3d4761d58055` | `f4693b2d573706c4e077d6c93503a5ddd7ee7b0a643196ef5f4c3d4761d58055` |
| [validation-survey-reprise2-20261022.decision-paid.png](validation-survey-reprise2-20261022.decision-paid.png) | `abd5929d1dce1249b85537adc9e983d89e37a3807fe51850031fa77992886892` | `abd5929d1dce1249b85537adc9e983d89e37a3807fe51850031fa77992886892` |
| [validation-survey-reprise2-20261022.smoke-restored.png](validation-survey-reprise2-20261022.smoke-restored.png) | `5d53b3f2eb9f432e085ecfc2e7e1dd02340b294f59ab436f7a6eccdcccf0f4ef` | `5d53b3f2eb9f432e085ecfc2e7e1dd02340b294f59ab436f7a6eccdcccf0f4ef` |
| [validation-survey-reprise2-20261022.attempt1.png](validation-survey-reprise2-20261022.attempt1.png) | `3ff48d6e06e9f9ce2eb2e86e9cf5bbf142438782a5e359c4371190e21e5db391` | `3ff48d6e06e9f9ce2eb2e86e9cf5bbf142438782a5e359c4371190e21e5db391` |

La preuve est ciblée. Elle ne représente ni le contrôle global `npm run check`, ni une campagne humaine complète, ni une certification des performances ou de l’équilibrage.
