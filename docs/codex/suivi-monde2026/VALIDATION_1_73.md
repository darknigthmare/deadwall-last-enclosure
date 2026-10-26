# Validation du suivi et du classeur 1.73 — S1b

Le candidat externe S1b est exporté et reçu par quatre lectures automatisées. Il conserve **15 feuilles et 1 181 formules**, sans erreur Excel ni cache de formule absent. Sa copie dans le dépôt reste une action distincte réservée à root après revue. La CI complète du commit final, la fusion et Vercel Production sont suivis séparément dans la [PR #20](https://github.com/darknigthmare/deadwall-last-enclosure/pull/20).

La référence source des liens du candidat est le commit réel **`b57d0fa83046fa8d4da99a394866734b13428a83`**, point S1b. La base publiée est `8780075f305e405e5aa94e593a70d11391b16e20`, version 1.72.0. Le candidat S1 antérieur et ses preuves sont conservés séparément ; ils ne qualifient pas les nouvelles sources. Une référence source ne désigne pas le commit final du classeur ni un déploiement reçu.

## Rapports rapprochés des sources courantes

Les lecteurs stricts acceptent les quatre rapports ci-dessous sur leurs véritables fichiers d'entrée. Les trois rapports de campagne, de supports et d'art ont été régénérés après le correctif moteur. Le rapport auteur reste valide sur ses 29 entrées inchangées ; aucune nouvelle exécution de ses 4 000 inspections n'est attribuée au correctif.

| Rapport | Portée | SHA-256 |
| --- | --- | --- |
| [Inspection auteur](inspection-20261023.json) | 4 000 plans ; 162 460 pièces meublées ; 588 378 équipements ; aucun refus ; 29 sources | `07e4f5a9cbfeb35d6c6309391e80d8885a5669366aa855829c6c16d567bb69af` |
| [Éligibilité G11](campagne205-eligibilite.json) | 200 modèles ; 63 instances de 58 modèles sur huit graines ; 226 sources stables | `21afaf14cca4ec979b356c31743d4e3576f84a0df74be459c1f2b9c8358c6841` |
| [Supports G11](campagne208-services.json) | 200 modèles et 2 905 supports accessibles ; séparément, 360 poses canoniques sur 23 sites de trois graines ; 243 sources stables | `96569e04a9cc5858fdb9d8490892141e4f37e7704308c64ff105c5a36f6b8fd2` |
| [Art G11](campagne208-art.json) | Quatre variantes V01 et treize présentations préparées ; neuf contrôles par présentation ; 243 sources stables | `4c73f001eef430ba73fb55cb7a7b09495344579e14c5d054f80b53b58cdd5f77` |

Les supports se répartissent en 625 fours, 1 880 couchages, 350 points d'entretien et 50 postes médicaux T047. Les graines des poses canoniques sont `0`, `17117` et `967313470`. Une pose accessible ne prouve ni un trajet complet ni un paiement. L'audit des supports qualifie **zéro transaction** ; les propriétaires de survie, de soins et de lanterne et leurs parcours Chromium conservent leurs preuves propres. Les présentations préparées ne constituent pas une inspection visuelle de toutes les 200 variantes.

Le correctif moteur conserve une enveloppe exacte et légère des solides extérieurs déjà lus. Les requêtes éloignées peuvent ainsi éviter la reconstruction de décors évincés des caches. Les caches de plans et de détails gardent leurs limites et les contextes dynamiques 160 restent lus par leur chemin historique. Ce mécanisme n'est pas une mise en cache des autorisations, des stocks ou des effets de service. Son audit et son contre-test sont distincts dans [la preuve de performance](validation-performance-1_73.json).

Le local « atelier entretien » T045 garde sa composition et ses identifiants historiques. Ses outils permettent l'entretien portable ; aucun établi supplémentaire n'est créé. Le suivi demeure à **800 tâches : 3 validées, 413 en cours et 384 à faire**. Les huit étapes services et graphismes T045–T048 commencent, sans validation globale des variantes d'inspection.

## Tests ciblés du suivi

Les journaux S1b reçus le 25 octobre 2026 ont été relus avant ce nouvel export : leurs tailles, SHA-256 et véritables pieds TAP sont rapprochés du [reçu du suivi](validation-suivi-1_73.json). Les huit fichiers de tests correspondent aux octets du point S1b. Cette relecture n'est pas présentée comme une nouvelle exécution complète du jeu.

| Groupe | Résultat natif | Journal archivé |
| --- | --- | --- |
| Progression 205 et 208 | 25 / 25 | [Progression](validation-progression-1_73.log.gz) |
| Lecteurs et gardes XLSX | 8 / 8 | [XLSX](validation-xlsx-1_73.log.gz) |
| Chargeur et suivi courant | 16 / 16 | [Chargeur](validation-chargeur-1_73.log.gz) |

Les trois sorties réelles sont à zéro, avec 49 succès et aucun échec, annulation, test ignoré ou TODO. Les essais incluent 94 altérations négatives de la feuille de services, un jeu indépendant avec un support refusé, les mutations réelles de police et de remplissage et douze cas négatifs des pieds déplacés de tables dérivées. Les anciens essais synchrones ayant signalé `spawnSync EPERM` restent exclus des réussites. Ces tests portent sur le suivi et les lecteurs ; ils ne sont pas un reçu global `npm run check`, des transactions de jeu ou une campagne humaine.

## Candidat S1b reçu

Le fichier externe `DEADWALL_CODEX_MONDE_SUIVI_1_73_S1b_CANDIDAT.xlsx` pèse **590 915 octets**. Son SHA-256 est **`1be9df6dc6f6eb268ff9d41ef4a64bf72e0f8f59b3899decd29230da8a60a29e`**. Les quatre lectures du même fichier ont réellement terminé avec un code de sortie `0` :

- [Comparaison à 1.72 et aux sources](validation-classeur-1_73.json) : 102 989 cellules de style comparées sur les quatorze feuilles héritées ; aucun changement, aucune exception de pied déplacé ; métadonnées rapprochées.
- [Comparaison au candidat S1 précédent](validation-classeur-S1-1_73.json) : 106 477 cellules de style comparées sur les quinze feuilles ; aucun changement ni exception.
- [CLI de compatibilité](validation-classeur-compat-1_73.json) : rapprochement des six JSON régénérés, dont `campagne-services-g11.json`, des identifiants, statuts et formules.
- [Comparaison à l'original public](validation-classeur-original-1_73.json) : 99 593 styles comparables ; les 33 143 adaptations auteur de renvoi à la ligne déjà documentées sont conservées ; 120 anciennes cellules de pied déplacées par l'agrandissement de la table d'inspection sont déclarées séparément.

Toutes les lectures acceptent quinze feuilles, 1 181 formules, zéro erreur Excel et zéro cache absent. Les comptes modèles, sites, poses, visuels et tâches sont réconciliés sans promotion globale de variante jouable. Les deux empreintes des rapports de services et d'art et les liens au commit S1b sont relus dans les cellules du classeur.

Les baselines conservées sont distinctes :

| Copie | Octets | SHA-256 |
| --- | ---: | --- |
| Classeur publié 1.72 | 571 563 | `6ecb2bc0340c86f3412ecbc8c62be4841bb47994491cc6cdd37ab13ded347b7b` |
| Classeur intermédiaire S1 | 590 719 | `662be369598bb8995abc62bd9651f24b513128bbb42eb8f819aa0dc71be3b585` |
| Original public | 539 765 | `a99fb40cbe9e809b852e0af20bced29c4828a76cdb0493c82b0615670fa0636b` |

Le classeur intermédiaire S1 est préservé avant installation de S1b, avec ses métadonnées et preuves historiques. Le fichier Drive original n'est ni remplacé ni synchronisé par cette procédure.

## Contrelecture et rendus

Une [contrelecture OOXML indépendante](validation-classeur-independante-1_73.json) recalcule les **1 181 caches** sans divergence et rapproche 82 440 cellules des données source. Elle contrôle les identifiants complets et uniques, les statuts, les alias, les supports, les empreintes et 5 103 liens source au commit S1b. Elle ne relance ni le jeu ni la CI et ne remplace pas la revue des captures. Son indicateur documentaire en attente décrit l'instant de cette lecture ZIP ; la clôture de la documentation est une réception séparée.

Six liens de la feuille historique « Références » restent conservés comme dans la base : cinq désignent le commit `6c6fbb6cf563bea6c89ade99c65f18c438481532`, un désigne l'ancienne branche `feat/codex-world-extension-20261021`. Ce dernier lien demeure mutable. Ils ne sont pas assimilés aux liens de preuves actuelles S1b.

Les **douze rendus par défaut** ont été examinés, dont les deux cadrages supplémentaires des totaux de Services G11 et des notes T045. Ils conservent la mise en forme historique. Les longues notes de Chantiers peuvent y être tronquées à l'affichage ; leur valeur complète est rapprochée des sources par les lecteurs.

Quatre autres captures servent à la **lecture dépliée** des notes T045–T048 : renvoi à la ligne, largeur et hauteur sont adaptés en mémoire, sans exporter ces changements dans le candidat. Le SHA du fichier est identique avant et après cette lecture. Ces quatre vues ne sont donc pas présentées comme le format par défaut du classeur. Les rendus et leur déclaration sont conservés dans le dossier externe de réception `xlsx173-S1b/preuves`.

## Reproduction de l'export

Le moteur de classeur est celui du runtime principal déjà configuré dans l'environnement ; aucun paquet supplémentaire n'est installé. L'exporteur relit les rapports et refuse une modification des sources ou du classeur pendant sa génération. Il exige une référence immuable de quarante caractères, identique au champ `sourceCommit` des [métadonnées 1.73](METADONNEES_PUBLICATION_1_73.json).

Les sorties doivent viser un nouveau dossier externe. Le premier argument du générateur JSON est positionnel :

```bash
CODEX_XLSX_DIR=/workspace/deadwall-cloud/extension208/xlsx173-S1b-reproduction
mkdir -p "$CODEX_XLSX_DIR"
node scripts/build-codex-tracker2026.cjs "$CODEX_XLSX_DIR/json"
"$CODEX_PRIMARY_RUNTIME_NODE" scripts/update-codex-tracker-xlsx2026.mjs \
  --root "$PWD" \
  --input /workspace/deadwall-cloud/extension208/xlsx173-S1b/historique-S1/DEADWALL_CODEX_MONDE_SUIVI.xlsx \
  --output "$CODEX_XLSX_DIR/DEADWALL_CODEX_MONDE_SUIVI_1_73_S1b_CANDIDAT.xlsx" \
  --proof-dir "$CODEX_XLSX_DIR/preuves" \
  --metadata "$PWD/docs/codex/suivi-monde2026/METADONNEES_PUBLICATION_1_73.json" \
  --ref b57d0fa83046fa8d4da99a394866734b13428a83 \
  --render
python -B scripts/verify-codex-tracker-xlsx2026.py \
  "$CODEX_XLSX_DIR/DEADWALL_CODEX_MONDE_SUIVI_1_73_S1b_CANDIDAT.xlsx" \
  --root "$PWD" \
  --baseline /workspace/deadwall-cloud/extension208/xlsx173/DEADWALL_CODEX_MONDE_SUIVI_BASE_1_72.xlsx \
  --metadata "$PWD/docs/codex/suivi-monde2026/METADONNEES_PUBLICATION_1_73.json" \
  --report "$CODEX_XLSX_DIR/validation-base-1_72.json"
python -B scripts/verify-codex-workbook2026.py \
  "$CODEX_XLSX_DIR/DEADWALL_CODEX_MONDE_SUIVI_1_73_S1b_CANDIDAT.xlsx" \
  "$CODEX_XLSX_DIR/json"
```

L'export n'installe pas le candidat. Root examine ses rendus et ses reçus avant de remplacer la copie du dépôt. Un échec doit rester conservé et sa cause corrigée avant toute réception positive.

## Réceptions distinctes

| Réception | État de ce reçu |
| --- | --- |
| Identité source | S1b réel `b57d0fa83046fa8d4da99a394866734b13428a83`, PR #20 |
| Classeur S1b | Candidat externe reçu ; installation réservée à root |
| CI complète du commit final | À recevoir séparément dans la PR #20 |
| Fusion | À recevoir séparément ; arbre et parents exacts à vérifier |
| Vercel Production | À recevoir sur le commit fusionné, puis comparer chaque fichier public et la racine au build reconstruit |

Ces contrôles de classeur ne qualifient pas le jeu complet. Les scénarios Chromium avec émulation tactile ne mesurent pas la cadence d'un téléphone physique ni une campagne humaine complète de six à dix heures.
