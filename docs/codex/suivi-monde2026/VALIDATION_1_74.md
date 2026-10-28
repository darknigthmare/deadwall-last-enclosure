# Réceptions du suivi 1.74

Cette procédure distingue les sources du jeu, les inspections physiques, les transactions dans Chromium, le classeur et la publication. Le checkpoint source précède l’export du classeur ; son SHA et le numéro réel de PR figurent dans les métadonnées d’export. Le commit du classeur et le commit fusionné peuvent donc être différents.

## Rapports actuels

Les cinq rapports sont réexécutés pour les sources 1.74 puis acceptés par leurs lecteurs stricts. Leurs empreintes sont conservées dans les métadonnées de publication.

| Rapport | Portée |
| --- | --- |
| [Inspection](inspection-20261023.json) | 4 000 plans, 29 sources, tous les enregistrements identiques à 1.73 ; 588 378 équipements posés, aucun refus |
| [Éligibilité G11](campagne205-eligibilite.json) | 200 modèles ; 63 instances de 58 modèles sur 8 graines ; 228 sources |
| [Services G11](campagne208-services.json) | 2 905 supports ; 360 poses canoniques sur 23 sites et 3 graines ; 245 sources |
| [Art des services](campagne208-art.json) | 13 présentations sur 4 modèles ; 1 392 images inactives identiques à la référence ; 245 sources |
| [Collecteurs](campagne214-eau.json) | 628 supports sur 200 modèles ; 72 poses sur 23 sites et 3 graines ; 251 sources |

Les deux audits de supports qualifient zéro transaction. Une pose canonique accessible n’est pas un trajet joué. Le [reçu local](validation-locale-1_74.json) conserve séparément 69 sous-tests natifs ciblés, 89 contrôles du navigateur et 42 du mode hors ligne. Les deux scénarios historiques utilisent explicitement G8 ; le parcours des collecteurs possède son harnais propre `scripts/browser-water214.mjs` et son workflow GitHub.

## Réception du classeur

Exporter un candidat externe depuis le classeur publié 1.73, après création du checkpoint et de la vraie PR. Utiliser `update-codex-tracker-xlsx2026.mjs`, les métadonnées 1.74 et une référence source immuable de quarante caractères. Générer les JSON du suivi dans un dossier externe avec `build-codex-tracker2026.cjs`.

Relire le candidat avec `verify-codex-tracker-xlsx2026.py`, comparé au classeur 1.73, puis `verify-codex-workbook2026.py` et les JSON courants. Rapprocher les cellules de PR et les états de Publication des métadonnées. Vérifier le SHA du rapport214 avant et après l’export. Examiner les rendus d’accueil, de publication et les quatre notes de services. Une lecture dépliée en mémoire doit être déclarée et ne doit pas modifier le fichier livré.

Les attentes conservées sont **15 feuilles, 1 181 formules, aucun cache absent, aucune erreur**, les styles et fonctions historiques, **800 tâches : 3 validées, 413 en cours et 384 à faire**, et aucune promotion globale de variante jouable. La copie du dépôt n’est remplacée qu’après réception du candidat ; l’original Drive reste historique.

## Réception du jeu et de la publication

Exécuter `npm run check` avec l’endurance activée, conserver les sorties réelles et les sous-tests, puis recevoir les contrôles GitHub du commit final. Les essais interrompus et diagnostiques restent séparés. Lire les nouveaux avis avant intégration.

Après fusion, vérifier les parents et l’arbre du commit réellement reçu. Un succès Preview ne qualifie pas Production. Pour Production, vérifier le commit du déploiement, la version servie et les octets de tous les fichiers publics contre un build reconstruit du commit fusionné. Une erreur d’authentification ou de quota ancienne ne décrit pas à elle seule l’état actuel du service.

Ces contrôles ne mesurent ni une campagne humaine de six à dix heures ni la cadence d’un téléphone physique.
