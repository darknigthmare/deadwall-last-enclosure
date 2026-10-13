# Audit du candidat 1.58.0 — DEADWALL

Base d'intégration : `c7174ca`, fusion de la PR #4 sur `main`. Les correctifs 1.57.1/1.57.2 sont conservés : G8 au nouveau départ, arrivée locale à D-17, focus et pause du prologue, espèces locales et identité de campagne. **La suite native avec endurance réussit : 3 258/3 258, code 0 ; les parcours navigateur réussissent également leurs 701 contrôles sur 16 contextes.** La première suite négative et les erreurs de préparation/distribution restent consignées ci-dessous. Commit, CI et publication 1.58 restent à vérifier séparément.

## Périmètre réel

| Domaine | Contenu du candidat |
| --- | --- |
| Codex | 1 000 parents indépendants DW-3001–4000 ; total 4 000 fiches et 2 000 parents. Les 3 000 fiches historiques restent conservées. |
| Plans | 7 500 pièces, 1 475 niveaux ; au moins six pièces par programme et trois niveaux maximum au total, sous-sol compris. Quatre géométries axial/offset/cross/gallery. |
| Terrain | Nouvelle partie G8 ; G9 volontaire depuis le dépôt. Les anciennes parties G7 conservent leur passage G7→G8→G9. Seuls les candidats compatibles sont implantés. |
| Consultation | Sources matérialisées de quatre lots, guide runtime, index et lecteur autonome hors connexion. Une fiche reste distincte d'un site accepté sur la carte. |
| Art | Dix PNG sources ; 137 dessins utilisés : 88 poses pour onze familles, neuf véhicules, douze montages, vingt-six détails et deux sacs du commandant. |
| Fonds conservé | 83 modèles D17 et 174 coupes effectives de la 1.57. Les 1 000 programmes n'ont pas chacun une toiture illustrée unique. |

Le contrat et le validateur commun sont dans `codex-3000/addendum-1.58/`. Le compilateur produit `src/codex3000-live-data.js`, `INDEX_1000.json` et `LIRE_1000_NOUVEAUX.html`. Les meubles et les sept ressources restent natifs ; les contenants ont leurs budgets finis historiques. Les usages décrits ne deviennent pas des services, productions ou bonus implicites.

## Corrections et risques examinés

| Risque | Réponse et contrôle attendu |
| --- | --- |
| Gonfler le Codex avec couleurs, états ou titres de variantes | Fiches nouvelles self-parent, noms et programmes fonctionnels ; validation des quatre lots et conservation exacte des valeurs historiques. |
| Quatre noms pour le même plan, pièces ou meubles inaccessibles | Géométries distinctes, passages réservés avant mobilier ; parcours entrée–pièces–étages–retour avec rayon réel. |
| Modifier G1–G8 en ajoutant des lignes au catalogue | Pools historiques bornés à DW-3000 ; G9 ajoute ses sites après G8. Comparaisons des identifiants, plans, détails et requêtes physiques. |
| Recouvrir un support payé ou renouveler un contenant fouillé | Guards transactionnels voiture/bivouac/éclairage ; reprise des registres, quantités et stocks sans reconstitution. |
| Perdre un relevé payé ou révéler gratuitement la région | Extension des sites des seuls secteurs déjà relevés ; sauvegarde aller-retour et contrôle des secteurs inconnus. |
| Coupes d'atlas contaminées ou modèles disproportionnés | Exclusion de seize poses A/B et deux véhicules lourds courts ; remplacement par atlas distincts, PNG originaux conservés et rectangles mesurés. |
| Animation, variante ou sauvegarde changeant l'identité | Seed et identité stable sans RNG ; raccord aux peintres propriétaires, pause, immobilité, mouvement réduit et coordonnées finies. |
| Asset présent mais absent de la distribution | Registre commun, scripts publics, build, serveur, cache PWA et HTML autonome contrôlés ensemble. |
| CI muette après une erreur | Résumé borné des erreurs navigateur et preuves structurées d'échec desktop. Les assertions et statuts d'échec restent conservés. |

Les risques d'incendie, d'infection, d'eau et de produits chimiques décrits dans les fiches sont des traces narratives. Les flux physiques, réserves, charges et collisions doivent provenir de leurs propriétaires existants.

## Preuves natives et compatibilité

| Vérification | Résultat observé |
| --- | --- |
| Première suite complète, `DEADWALL_SOAK=1 npm run check` | **Code 1 : 3 256/3 258 réussites, deux échecs, aucune annulation ni omission.** Syntaxe de 238 fichiers et build de 289 fichiers publics réussis auparavant ; 4 187 fichiers observés inchangés pendant le contrôle. Cette passe est conservée comme négative. |
| Corrections des deux attentes historiques | Le test de couvertures reste limité aux 2 700 programmes rendables historiques DW-0001–3000 ; les 1 000 nouveaux ont leurs tests distincts. La fixture de sauvegarde rejette G10 et 9,5, puisque G9 est maintenant valide. Les assertions avant mutation restent conservées. Rejeu ciblé : 27/27, zéro échec/annulation/omission ; il ne remplace pas la seconde suite complète. |
| Géométrie contre `main` c7174ca, 13 octobre | 16/16 mondes comparés isolément sur les seeds 17117/84329 et G1–G8 : plans, détails, menaces et requêtes physiques échantillonnées identiques, sources inchangées. Ne couvre pas toutes les seeds ou le rendu navigateur. |
| Art final | Dix copies identiques aux originaux, dimensions/SHA consignés ; 155 entrées de coupe dont 18 exclues, soit 137 dessins utilisés. Ciblé final : 12/12, code 0, zéro échec/annulation/omission. |
| Distribution après correction du standalone | 7/7, code 0. Un vrai build isolé sans `node_modules` vérifie les dix URL PNG embarquées, leurs octets, métadonnées et objets figés. |
| Script de setup réutilisable | Code 0, 39/39 contrôles ; dépendances réutilisées conformes, build actuel et sources inchangées. Ce contrôle ne certifie pas une installation vierge ou la suite native complète. |
| Seconde suite complète avec endurance | **Code 0, accepté : 3 258/3 258, quatre suites, zéro échec/annulation/omission/todo.** Les 4 187 fichiers observés restent inchangés pendant le contrôle. Durée des tests : 1 906 996,339615 ms. Reçu `check-final-resumed2.receipt.json` et journal `check-final-resumed2.log`, empreinte du journal vérifiée. |

Les ciblés qui recouvrent la suite complète ne sont pas additionnés à son total. Les reçus du 11 octobre restent historiques : 15/15 sur les premiers lots/plans, compilation idempotente et 16 mondes comparés contre 68e91f2. Ils ne remplacent pas la comparaison actuelle contre c7174ca ni la qualification du candidat final.

## Parcours navigateur terminés

Tous les parcours ci-dessous ont leurs rapports positifs et un **code de sortie 0 conservé**. Ils ne présentent aucune erreur page, console, HTTP ou requête. Les sous-listes native/fixtures de visibilité sont déjà incluses dans ses 89 contrôles par format et ne sont pas comptées une deuxième fois.

| Parcours | Contrôles réussis | Contextes |
| --- | ---: | ---: |
| Général : bureau, portable, mobile portrait/paysage | 179 | 4 |
| PWA hors connexion : bureau/mobile | 34 | 2 |
| Arrivée D-17, focus, Pause/Reprendre et identité | 50 | 2 |
| Campagne : récolte, dépôt, construction, recrutement, assaut et reprise | 98 | 2 |
| Contacts observés, disparition immédiate, obstacles, nuit et étages | 267 | 3 |
| G7→G8→G9 sur bureau, G8→G9 sur mobile, fouille et sauvegarde/Continuer | 64 | 2 |
| HTML autonome reconstruit, servi par HTTP | 9 | 1 |
| **Total distinct** | **701** | **16** |

Les sources runtime et les dix PNG restent identiques entre ces parcours. La correction de distribution est intervenue ensuite dans le build et son test ; le standalone a été reconstruit et rejoué sur le nouvel HTML. Ce dernier contrôle est **HTTP uniquement** : il ne qualifie pas une ouverture en `file://`.

Le parcours G9 utilise des approches préparées par sauvegarde validée, un prélèvement historique fini et, au nouveau site, des délais de calme/migration allongés. Il n'injecte aucun pas de simulation. Sur la seed 17117, 96 nouveaux sites sont acceptés avec conservation des lieux G8 ; ce nombre ne garantit pas l'implantation sur toute seed. Les scènes de visibilité préparées distinguent leurs contacts, compagnons, mur, nuit noire et étage des actions ordinaires de départ. Les vues mobiles sont émulées, pas des appareils physiques.

## Tentatives négatives conservées

| Tentative | Cause établie et correction | Rejeu |
| --- | --- | --- |
| Première suite native complète, code 1 | Deux attentes historiques périmées : le compteur de couverture incluait les nouveaux programmes, et G9 était encore testé comme invalide. Correction des fixtures, assertions historiques conservées. | 27/27 ciblés, puis suite complète 3 258/3 258, code 0 ; les ciblés ne sont pas ajoutés au total global. |
| Premier helper G9, code 1 | Les snapshots de `serialize()` gardaient des références vivantes qui dérivaient pendant RAF. Le **helper externe uniquement** les fige maintenant synchroniquement avec `structuredClone`. Aucun correctif du runtime n'est attribué à cette erreur de preuve. | 64/64, code 0. |
| Premier autonome HTTP, code 1 | Les dix URL art158 calculées n'étaient pas remplacées par l'ancien `replaceAll` du build : dix demandes PNG externes répondaient 404. **Correctif de build uniquement** : sérialisation du registre d'assets résolu en URL de données, métadonnées et `freeze` conservés, garde d'un remplacement unique. Runtime et PNG inchangés. | Distribution 7/7 et HTML reconstruit 9/9, codes 0 ; zéro demande externe. |
| Première visibilité, rapport négatif | Après 69 contrôles bureau réussis, la fixture levait « Free regional road required » : elle exigeait un voisinage sans POI à 90 m et un axe horizontal, incompatibles avec les parcelles G8 denses. **Correctif du test uniquement** : corridor sur route réelle, axe de route, balayage de fractions, poses hors parcelles et garde physique de 0,4 m. Assertions de visibilité et persistance conservées ; aucune panne du runtime déduite. | Premier rapport corrigé 267/267, sans code conservé ; rejeu final 267/267 avec code 0 et sources inchangées. |

## Reçus et points encore ouverts

Les preuves de cette session sont hors dépôt dans `/workspace/deadwall-cloud/audit158/` : `check-final-resumed1.receipt.json`, `check-final-resumed2.receipt.json` et son journal, `historical-contracts-rerun1.log`, `current-main-compat/`, `sprites158-final.receipt.json`, les reçus `browser-*-final` et `browser-standalone-rerun1`, `standalone-embedding-targeted.receipt.json`, `setup-final.receipt.json` et `browser-final/`. Les bilans `documentation-browser-final-verified.json` et `browser-validation-final.json` confirment les sept rapports, 701 contrôles distincts et 16 contextes. `browser-runtime-binding-final.json` confirme l’identité exacte des 289 fichiers publics malgré la correction de build ; il ne prétend pas conserver les anciens scripts de build/tests/docs ou l’ancien HTML autonome. La première visibilité négative est conservée dans `browser-final/visibility-2026-10-13T11_15_32_600Z/`. Ces dossiers externes ne sont pas fournis par un clone ; les tests et commandes restent reproductibles depuis les sources.

Les galeries et captures produites doivent être distinguées des images effectivement inspectées ; une vérification alpha ne démontre pas seule la lisibilité d'une animation. Aucun compteur d'inspection visuelle supplémentaire n'est déduit ici du nombre de captures créées.

Au 13 octobre, la CI de c7174ca a réussi sous Windows et échoué sous Linux sur `test:visibility` après les étapes précédentes réussies. La reproduction locale finale de visibilité est maintenant positive, mais **la CI du futur commit 1.58 reste en attente**. La production Vercel observée sert encore la 1.57.2 avec HTTP 200 ; **aucune publication 1.58 n'est encore attestée**. Après livraison, vérifier commit distant, CI, déploiement et version/octets publics HTTPS contre le build qualifié.

La seconde suite générale `DEADWALL_SOAK=1 npm run check` est terminée et réussie. Les seules modifications documentaires postérieures au contrôle sont reliées par leurs empreintes avant/après ; elles ne changent pas le runtime, les tests ou les PNG qualifiés. Une correction ultérieure requiert une nouvelle vérification des parties concernées. L'émulation mobile, le navigateur cloud et les scènes préparées restent distincts de téléphones physiques, Windows natif et campagnes humaines. La cible Standard de 6 à 10 heures jusqu'au onzième âge reste à mesurer ; cet audit ne certifie ni une cadence universelle ni la commercialisation.
