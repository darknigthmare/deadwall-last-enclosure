# Validation du point source S2 — DEADWALL 1.74

Le point S2 corrige l’accès régional : le bouton Région ouvre la météo, puis l’onglet récupérateurs reste disponible. Le propriétaire d’eau, ses coûts, ses volumes, les cartes et leurs dimensions ne changent pas. Le classeur est exporté après création du vrai checkpoint source local ; ses métadonnées portent ce SHA et le numéro réel de la PR #21. La publication et la CI de la tête finale sont reçues ensuite.

## Sources et preuves physiques

Les quatre rapports de campagne sont réexécutés après le correctif, puis leurs lecteurs stricts rapprochent tailles et SHA de chaque source. Les seuls changements de provenance sont le fichier d’interface et le test de parcours ajouté. Les résultats hors provenance restent identiques à S1.

| Rapport | Résultat reçu | SHA-256 |
| --- | --- | --- |
| Inspection auteur | 4 000 plans, 588 378 équipements, 0 refus ; 29 sources toujours valides, sans nouvelle exécution après ce correctif | `590578f6efbac986e20bc9da9bef8239a19f9371bbf927a3738bcd31663d135b` |
| Éligibilité G11 | 200 modèles ; 63 instances sur 8 graines ; 228 sources | `c88a732eee5d37dc3ba3bd0afbde4f8ca7e57aa5b608eeb61a3a6f922ef664ac` |
| Supports G11 | 2 905 supports accessibles ; 360 poses sur 23 sites et 3 graines ; 245 sources | `92daf24db23eb6f250b45dbe69f83788517bdcb1fc0c4a647c454db937ec7060` |
| Art G11 | 13 présentations sur 4 modèles ; 1 392 images inactives historiques identiques ; 245 sources | `145fcac05fdd809014f73b819b38f92ea069d688da38a7f382e8b2c0c8f0c9d1` |
| Récupérateurs | 628 supports sur 200 modèles ; 72 poses sur 23 sites et 3 graines ; 251 sources | `0b035133d1f101ced3853657d5a8e07c7c01dc4005dd48bf4fe6e1be5fb8b798` |

Les audits de supports qualifient zéro transaction. Les 628 tonneaux concernent l’ensemble des 200 modèles audités, pas un nombre garanti dans chaque partie. Le [reçu des rapports](validation-rapports-S2-1_74.json) conserve la comparaison avec S1. Les anciennes preuves restent consultables dans le [point F3](https://github.com/darknigthmare/deadwall-last-enclosure/tree/610e0ae72584c243e34ec4caad9d4bdd87f0fba9/docs/codex/suivi-monde2026).

## Régression du jeu

Le [reçu S2](validation-S2-1_74.json) conserve les **70 sous-tests natifs ciblés**, sans échec, annulation, test ignoré ou TODO, et les trois scénarios navigateur inchangés : météo 26/26, cueillette 46/46, défenses 42/42. Leur groupe complet réussit **114/114** sur six profils au total. Le nouveau test régional vérifie la sélection météo puis récupérateurs et la conservation de la sauvegarde, du sac, du dépôt et du RNG.

Les [parcours des récupérateurs S2](validation-eau-S2-1_74.json) passent **117/117**, sur ordinateur et en tactile émulé : dix reprises exactes et quatre transferts conservatifs. Leurs fixtures initiales sont déclarées ; les actions, volumes, paiements et reprises sont observés ensuite sans injection de résultat. La course de huit secondes du contrôleur tactile ne borne pas le relevé final ni l’acquittement du relâchement. Les six captures conservent leurs limites de lisibilité à ce cadrage ; aucune mesure de fluidité ou de téléphone physique n’en est déduite.

Le build S2 produit **370 fichiers publics**, avec l’empreinte `216eab28b4f24782992f384c969ad6ec1b8b8b83ccaa2044321e2fa84a5a9fcf`. L’empreinte des plans compilés reste `aaa29ca45da71facea8379614897d858847af783bf08676572e4fd310008080c`.

## Réception du classeur et de la livraison

Conserver le classeur S1 et ses métadonnées avant export. Produire un candidat externe avec les métadonnées S2 et le vrai SHA du checkpoint. Rapprocher le fichier des sources et des JSON courants avec les deux lecteurs officiels ; comparer les formules, caches et styles au précédent candidat et à la base publiée. Vérifier les champs PR/états et le SHA du rapport214 avant/après, puis examiner les rendus avant installation.

Les invariants restent **15 feuilles, 1 181 formules, zéro erreur et cache absent**, avec les **800 tâches : 3 validées, 413 en cours et 384 à faire**, sans promotion globale des variantes jouables. Le fichier Drive original reste historique.

Le candidat **S2b est reçu et installé** : 591 249 octets, SHA-256 `56f2cc4f9b6934107322182f6212112800bb4a36ac96aa7a5543f119f7ae80df`. Les [deux lecteurs](validation-classeur-S2-1_74.json) et la vérification du fichier installé passent ; les 106 477 styles et les 1 181 formules sont conservés. Sept rendus ont été examinés par l’agent de suivi, dont les quatre lectures dépliées ; root a examiné Publication, Accueil et la note T045. Les 21 PNG ont été régénérés, sans assimiler leur génération à une revue visuelle de chaque vue.

Le [reçu externe](validation-classeur-reception-S2-1_74.json) et l’[installation](validation-classeur-installation-S2-1_74.json) gardent les ancrages et empreintes exacts. Le premier export S2a reste un diagnostic visuel : la dernière ligne de E9 était coupée. S2b raccourcit ce seul texte de métadonnées, sans modifier le format du classeur. Les cellules CI et Production décrivent le point de préparation S2, pas une publication déjà reçue.

La CI de la tête finale, sa fusion et Vercel Production ne sont pas déduites de ces contrôles partiels. Après fusion, recevoir le vrai commit et son arbre, reconstruire ce commit isolément, puis comparer la racine et les 370 fichiers servis avec une identité de déploiement stable avant/après. Les échecs et essais interrompus restent conservés, sans substitution de résultat entre révisions.

Les scénarios préparés et le tactile émulé ne certifient ni une campagne humaine de six à dix heures ni la cadence d’un téléphone physique.
