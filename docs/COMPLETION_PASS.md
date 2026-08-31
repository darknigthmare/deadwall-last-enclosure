# DEADWALL 1.0 — audit technique de clôture, passe r11

État local du **31 août 2026**, après les validations locales Node, HTTP et navigateur, avant clôture de la publication. Ce document décrit les changements présents dans l'arbre de travail et les preuves disponibles à cet instant ; **ce n'est ni une certification commerciale ni le procès-verbal de la nouvelle livraison**. Le commit, le déploiement de production et le nouveau paquet Windows doivent être consignés dans le rapport final de publication.

## Périmètre et continuité

La boucle récolter → déposer → construire → automatiser → fortifier → survivre → réparer reste inchangée. La difficulté repose toujours sur la masse, les fronts, les accès, les munitions et la logistique, sans santé de boss ajoutée.

L'inventaire du code conserve **22 bâtiments, 8 profils d'infectés, 4 rôles de survivants, 6 secteurs, 6 traces narratives et 10 textures/atlas**. Les quatre chapitres du registre facultatif et les ressources historiques des cartes sont préservés. Cette passe **n'a généré aucun nouvel asset OpenAI** : elle utilise les visuels originaux déjà documentés dans [GAME_ART_PROVENANCE.md](GAME_ART_PROVENANCE.md) et [CONTENT_ART_PROVENANCE.md](CONTENT_ART_PROVENANCE.md), avec de nouveaux indicateurs et styles d'interface locaux.

Les principaux changements sont :

- **Quatre départs** : classique, Convoi de civils, Dépôt à reconstruire, Arrière-garde. Ils font varier les ressources, l'équipe, l'intégrité du centre ou le premier calme, avec contreparties affichées. Ils ne changent ni la carte d'une graine, ni les difficultés, ni les règles des vagues suivantes. Les records séparent départs et difficultés. Voir [SCENARIOS.md](SCENARIOS.md).
- **Trois sections de fusiliers** : Alpha, Bravo, Charlie, chacune avec ralliement ou repli. Affectation stable, trajets physiques, dépenses de combat inchangées, migration sans téléportation. Raccourcis 4/5/6, G, T et commandes du poste tactique ; armes 1/2/3 conservées. Voir [SQUADS.md](SQUADS.md).
- **Situation par front** : nord, est, sud, ouest, contacts vivants, proximité dans un rayon de 320 unités et remparts achevés fragiles à 30 % d'intégrité ou moins. La proximité **ne prouve pas une brèche**. Le relevé est limité à deux actualisations par seconde ; un signal sonore d'entrée, sans boucle, respecte quinze secondes de délai.
- **Débrief de défaite** : vagues effectivement repoussées, éliminations, pics et pertes observés ; trois conseils au maximum, sans inventer la cause de la défaite. Les fractions de carburant encore utilisables et les rations supérieures au seuil de pénurie ne sont plus déclarées épuisées. Rejouer conserve le départ et la difficulté avec une nouvelle identité de campagne.
- **Distribution synchronisée** : nouveaux modules et styles ajoutés aux listes publiques explicites du build, du serveur et du protocole PC ; cache PWA `deadwall-v1.0.0-r11`. La présence du cache dans les sources ne remplace pas un essai hors ligne réel.

## Priorités et résultat de cette passe

| Priorité | Risque ou manque traité | État et preuve à cet instant |
| --- | --- | --- |
| P0 | Une reprise réappliquerait les ressources d'un départ, mélangerait les records ou déplacerait les anciens soldats. | Données additives validées avant mutation ; anciens fichiers vers le classique et leur ancien ralliement ; identités et affectations conservées. Tests scénarios, profils, sauvegardes et sections passants localement. |
| P0 | Un module manquerait dans une distribution ou des fichiers de pilotage deviendraient publics. | Build local réussi ; 42 fichiers publics comparés octet pour octet, 11 chemins sensibles refusés. Validation finale de production et du paquet r11 encore à consigner. |
| P1 | Les parties démarrent toutes de la même façon et les records de variantes deviennent incomparables. | Quatre départs à contreparties et douze combinaisons départ/difficulté testées ; records distincts, sans bonus permanent. |
| P1 | Un ralliement unique empêche de préparer plusieurs fronts et le repli est ambigu. | Trois sections indépendantes, reprise des ordres, accès physiques et consommation de munitions testés ; l'ancien ralliement général reste disponible. |
| P1 | La proximité d'une horde, la fragilité des remparts et le bilan de défaite sont peu explicites. | Quatre fronts, alerte bornée et débrief factuel raccordés ; 14 tests ciblés purs/UI passants et parcours navigateur de clôture validé. Les assertions automatiques ne constituent pas un jugement visuel humain global. |
| P1 | Les performances à forte charge ne sont décrites que par des plafonds techniques. | Profil RAF instrumenté réalisé sur une configuration précise, résultats et limites ci-dessous ; aucune promesse de cadence universelle. |
| P2 | Variations matérielles, fatigue de parties prolongées et jugement visuel humain. | Couverture partielle uniquement : tests automatisés et endurance assistée, pas une campagne humaine ni une matrice de machines. |
| P2 | Mise sur le marché signée et choix de boutique. | Ouvert : édition Windows non signée, identité/certificat éditeur et choix de distribution à obtenir ; aucune publication boutique ni certification annoncée. |

Les priorités qualifient les risques de la passe, pas une affirmation que tous les défauts possibles du produit auraient été éliminés.

## Vérifications locales constatées

`npm run check` a terminé sans échec : **322 tests actifs réussis**, sur 323 déclarés avec le test d'endurance opt-in ignoré dans cette commande. Le build fait partie de cette vérification. Trace locale : `artifacts/completion-final-check.log`.

Deux tests de mise à jour du service worker complètent la couverture : attente des huit nouvelles dépendances avant activation et conservation du cache r10 quand l'une manque. Les caches étrangers sont conservés. Ces tests VM vérifient le contrat du worker ; les essais navigateur ci-dessous vérifient le fonctionnement réel hors ligne.

Le nouveau test `campaign-policy.test.cjs` exerce les quatre départs en Standard sur la graine 17117, pendant 600 secondes chacun : 15 chantiers payés par départ, recrutements ordinaires, deux vagues repoussées et 88 points de sauvegarde contrôlés. La politique utilise les entrées de déplacement, interaction et combat normales ; elle n'ajoute ni ressources, santé, munitions, construction gratuite, téléportation ou dégâts. Deux exécutions ciblées ont reproduit les mêmes empreintes. Aucune chute ni perte n'a été observée avec cette politique. Cela reste une stratégie scriptée sur une seule graine, pas un panel humain ni une preuve de l'équilibre de toutes les parties.

Le test d'endurance a ensuite été exécuté séparément avec `DEADWALL_SOAK=1` : **1/1 réussi**, sortie console vérifiée pendant la passe, environ 6,94 secondes de calcul. Il couvre **deux sessions de 900 secondes simulées**, 32 points de sauvegarde/reprise et 452 vérifications d'invariants, ainsi qu'une sonde séparée atteignant 720 infectés. **Un bot de sécurité élimine artificiellement les ennemis approchants** : 106 et 160 éliminations assistées selon la session. Ces trente minutes simulées ne sont ni trente minutes de jeu humain, ni une preuve d'équilibrage, ni un benchmark graphique. La sortie n'a pas été enregistrée dans un fichier : aucun chemin de preuve n'est inventé.

Le contrôle HTTP local a réussi **55 vérifications** :

- 42 fichiers publics répondent 200 et correspondent exactement au build ;
- 11 chemins sensibles, dont chemins encodés, répondent 404 ;
- POST est refusé avec 405 ; HEAD répond 200 sans corps et avec `nosniff`.

Rapport local : `artifacts/http-qa/2026-08-31T18_58_59_192Z/report.json`. Cela contrôle le serveur loopback et le build, **pas Vercel**.

Les **cinq suites navigateur locales sont passantes : 1 160 vérifications sur 30 contextes**, sans erreur runtime/console ou HTTP consignée :

- commandement : 175 ; contenu : 288 ; récit : 217 ; fiabilité : 198 ;
- nouvelle clôture : 282, dont sélection des départs, sections, sauvegarde/reprise, débrief, records séparés et cache PWA r11 hors ligne.

Les quatre rapports de régression sont sous `artifacts/{command,content,narrative,reliability}-qa/completion-r11-regression/report.json` ; celui des nouveaux parcours est `artifacts/completion-qa/completion-r11-first/report.json`. Chaque suite emploie six contextes vierges. Les commandes clavier/souris et contrôles réels sont automatisés aux différents formats ; ce n'est pas un essai sur trente machines ni une certification tactile/manette. Les scènes de contacts, remparts, décès et statistiques sont des fixtures déclarées. Les captures restent distinctes d'une validation visuelle humaine exhaustive.

Ces résultats établissent les parcours et le hors-ligne **locaux**. Les contrôles de production, une éventuelle installation PWA par le système et les nouveaux lancements du paquet Windows r11 ne sont pas déduits de ces assertions ; les résultats de publication doivent être consignés séparément.

## Profil de performances réellement mesuré

Preuve locale : `artifacts/performance-qa/completion-r11-initial-DFEfmN/report.json`, exécutée de 18:55:45 à 18:56:29 UTC. Les quatre contextes ont terminé sans erreur runtime, console, HTTP ou requête. Les empreintes de `core.js`, `game.js` et `art.js` chargés correspondent aux sources locales, inchangées pendant cette mesure.

Le rapport mentionne le commit de base `e7b37b749834a9f186199de68c60ca0bfd00c1d2` **avec un arbre modifié** : les chiffres décrivent cet instantané de travail, pas ce commit seul ni un binaire publié.

Environnement : Windows x64, AMD Ryzen 9 7950X, 32 processeurs logiques, Node 24.15.0 et Chromium headless 151.0.7922.34. Le diagnostic WebGL annonce une Radeon RX 6800 XT via ANGLE/Direct3D11. Il identifie le renderer ; **aucun temps GPU n'a été mesuré**.

Fenêtre 1280 × 720, DPR simulé 2. La qualité automatique dessine dans un Canvas 2560 × 1440 ; la qualité légère limite celui-ci à 1280 × 720. Chaque contexte dispose de 2 secondes de chauffe RAF puis d'environ 6 secondes échantillonnées, sans avancer manuellement la simulation.

| Scène / qualité | Images RAF observées | Update médiane / p95, ms | Render médiane / p95, ms | Intervalle RAF médiane / p95, ms |
| --- | ---: | ---: | ---: | ---: |
| Calme / automatique | 366 | 0,20 / 0,80 | 0,90 / 1,40 | 16,70 / 16,90 |
| Calme / légère | 366 | 0,20 / 0,70 | 0,80 / 1,20 | 16,70 / 16,80 |
| 720 infectés / automatique | 297 | 1,50 / 3,90 | 8,40 / 11,00 | 16,70 / 33,40 |
| 720 infectés / légère | 349 | 1,40 / 2,90 | 7,60 / 10,20 | 16,70 / 16,80 |

Le calme conserve trois ouvriers sur une nouvelle carte, avec positions normalisées et calme prolongé. La charge est une **fixture injectée**, pas une cité construite en partie : deux enceintes, 223 structures initiales, 48 unités réparties entre les quatre rôles, 720 infectés des huit profils, nuit et pluie. Les réserves de munitions sont volontairement nulles pour ne pas diminuer la population ennemie par des tirs alliés. Les structures peuvent réellement être détruites : leur nombre observé varie de 223 à 217, tandis que les 720 infectés et 48 unités restent présents dans les échantillons. Cette fixture ne couvre pas une armée tirant à plein régime.

Sous cette charge, le rendu occupe davantage de temps instrumenté que l'update. L'automatique compte 66 intervalles RAF supérieurs à 25 ms, contre 15 en légère ; aucun intervalle n'est strictement supérieur à 50 ms. Ce constat limité **n'est pas une garantie de 60 FPS**. Les mesures d'update/render sont des temps écoulés côté JavaScript, inclusifs et instrumentés ; elles comprennent les commandes Canvas synchrones, les pauses et les appels imbriqués. Le retour de `render()` ne signifie pas que le GPU a présenté l'image. Il ne faut pas additionner les sous-méthodes à leur parent.

Un comptage distinct, sans chronométrage, a confirmé 34 560 comparaisons zombie/ouvrier dans un update à 720 × 48 acteurs. Un index spatial allié est une piste, pas une optimisation revendiquée comme livrée. Cette courte mesure unique sur une machine puissante ne permet pas de fixer une configuration minimale, d'extrapoler à un téléphone ni de certifier la stabilité de campagnes extrêmes.

## Reproduction

Depuis la racine du dépôt :

```powershell
npm run check
$env:DEADWALL_SOAK='1'
node --test tests/soak.test.cjs
Remove-Item Env:DEADWALL_SOAK
node tests/http-release.mjs
node --test tests/scenarios.test.cjs tests/squads.test.cjs tests/battlefield.test.cjs
```

Le profil graphique requiert un serveur local déjà démarré, Playwright et Chromium disponibles, ainsi qu'une autorisation préalable de pilotage navigateur. Les variables `DEADWALL_PLAYWRIGHT_MODULE` et `DEADWALL_CHROMIUM` permettent d'indiquer les installations existantes. Le drapeau ci-dessous enregistre cette condition ; **il ne constitue pas une autorisation**.

```powershell
$env:DEADWALL_QA_BROWSER_APPROVED='1'
$env:DEADWALL_QA_URL='http://127.0.0.1:4322'
$env:DEADWALL_QA_LABEL='completion-r11-repeat'
node tests/performance-profile.mjs
```

Exécuter le profil seul, sans build, suite de tests ou autre navigateur QA concurrent. Un nouveau sous-dossier est créé pour chaque mesure. Conserver le JSON brut et ses captures, sans transformer les fixtures en preuve de jeu naturel. Les rapports `artifacts/` sont des preuves locales ignorées par Git, pas des ressources publiques distribuées.

## Limites et décisions restantes

DEADWALL reste un jeu solo Canvas 2D/2.5D, livré via un shell Windows Electron autonome et les éditions navigateur/PWA/HTML. **Conduite de véhicules, coopération réseau et port 3D ne sont pas implémentés.** Les véhicules visibles restent des épaves récupérables ; les auteurs des traces narratives ne deviennent pas des PNJ dialoguant en direct.

Les tests automatiques établissent les contrats qu'ils exécutent ; ils ne remplacent ni les essais humains prolongés, ni un audit d'accessibilité exhaustif, ni plusieurs configurations matérielles. Une signature Windows, un compte et une boutique de distribution, les exigences de cette boutique et l'organisation du support exigent des choix et moyens d'éditeur. Aucun certificat, compte commercial ou statut de conformité n'est supposé acquis. Voir [DESKTOP.md](DESKTOP.md) et [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Le rapport de livraison doit reprendre les preuves des parcours locaux et joindre les contrôles de publication ainsi que le manifeste du nouveau paquet Windows. **Aucune conclusion « tout terminé » ni nouveau commit/déploiement n'est annoncée dans cet audit intermédiaire.**
