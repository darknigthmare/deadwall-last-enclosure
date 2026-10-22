# DEADWALL — PR #16 : 1 000 inspections et classeur de référence

La [PR #16](https://github.com/darknigthmare/deadwall-last-enclosure/pull/16) reprend le travail préparé précédemment et ajoute 600 plans auteur. Les sources de l’audit des 1 000 plans et du contrôle intégral sont `7ec448a552c6ad65cc3b167e9e4974d7f8772585` ; cette livraison ajoute le classeur Excel, les preuves et une correction de fixture vérifiée séparément après cette passe. La base de comparaison est main `74a62084e96dd7e78463bd4e15b9ec2897887704`, version 1.69.0.

## Contenu livré

- 1 000 variantes inspectables dans le Guide auteur, réparties sur 20 typologies, dont 400 agricoles et 200 résidentielles ajoutées dans cette reprise.
- 30 990 pièces décrites, 30 960 pièces meublées, 103 450 équipements posés et 7 933 placements refusés explicitement. L’inspection ne transforme pas les objets refusés en objets installés.
- 1 900 niveaux, 224 885 segments de mur et 900 transitions. Les accès, faces de service, collisions, espaces extérieurs et changements de niveau sont contrôlés.
- 80 typologies et 4 000 variantes restent la cible du projet ; 800 tâches : 3 validées, 97 en cours, 700 à faire.
- Les 4 000 programmes du catalogue historique sont préservés ; ils ne sont pas comptés comme 4 000 nouvelles variantes déjà conçues.
- Aucune nouvelle variante n’est implantée en campagne. Les dimensions des nouveaux lots agricoles et résidentiels sont déclarées comme choix auteur ; la collecte des références architecturales réelles reste ouverte.

## Classeur et copie Drive

`DEADWALL_CODEX_MONDE_SUIVI.xlsx` contient 13 feuilles et 1 165 formules : zéro erreur de formule, zéro résultat mis en cache manquant. Les tableaux, validations et caractéristiques historiques sont préservés et comparés au fichier de référence récupéré. La table d’inspection couvre bien les 20 typologies.

- Taille : 539765 octets.
- SHA-256 : `a99fb40cbe9e809b852e0af20bced29c4828a76cdb0493c82b0615670fa0636b`.
- Blob Git : `f70fffd56ee45a4deccafc71c78110f394dc7eff`.
- Vérification indépendante : `verification-classeur-20261022.json`.
- [Fichier Drive existant mis à jour](https://docs.google.com/spreadsheets/d/1D4Agls6Q2BP1H8Oi9SRb1nOvg1Ff7p1X/edit) : même identifiant, même dossier ; les octets relus correspondent exactement au XLSX livré.

`CLASSEUR_REFERENCE.json` rassemble l’empreinte, la publication Drive, la source exécutée et les limites de qualification. La feuille Publication du classeur renvoie à ce manifeste afin de ne pas créer une empreinte autoréférente dans le fichier Excel.

## Validation du 22 octobre 2026

Le contrôle `npm run check` a réussi : **5 663 tests, 5 662 succès, 0 échec(s), 1 ignoré(s), 0 annulation(s)**. Code de sortie réellement observé : `0`. Il comprend 403 fichiers de syntaxe et un build de 364 fichiers publics avec le standalone. La provenance et le journal intégral compressé figurent dans `validation-20261022.json` et `validation-globale-20261022.log.gz`.

Les six partitions natives de GitHub ont aussi terminé avec l’endurance activée : **5 663 tests réussis sur 525 fichiers, zéro échec, ignoré, annulation ou TODO**. L’agrégat accepté et sa provenance sont archivés dans `validation-ci-native-20261022.json`. Le checkout de fusion synthétique possède le même arbre que `7ec448a552c6ad65cc3b167e9e4974d7f8772585`. Cet agrégat reste distinct du workflow supplémentaire `literal full check 201` et des contrôles navigateur/Windows.

Le [workflow séparé literal full check 201](https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/39763290836/job/119772488808), exécuté lui aussi avec l’endurance sur `7ec448a552c6ad65cc3b167e9e4974d7f8772585`, a **échoué : 5 662 succès, 1 échec, aucun test ignoré, sur 5 663 tests**. Son reçu n’est pas accepté. Le cas `151 vehicles: every existing profile can enter every physically clear driving seam` échoue dans le helper `paid` de `tests/vehicle-boundary151.test.cjs`. Le même cas a réussi dans la passe locale et dans la partition CI correspondante ; ces réussites ne remplacent pas l’échec observé du workflow intégral. La cause de cet échec n’est pas établie. Le reçu, le journal et les limites du diagnostic figurent dans `validation-ci-literal-20261022.json`.

| Contrôle complémentaire | Résultat | Preuve |
| --- | --- | --- |
| Géométrie et mobilier des plans auteur | 1 000 / 1 000 | `inspection-20261021.json`, génération du 22 octobre |
| Guide auteur Chromium | 112 / 112 sur ordinateur et mobile simulé | `validation-guide-20261022.json` |
| Campagne historique Chromium | 196 / 196, quatre formats simulés | `validation-campagne-20261022.json` |
| Suite mobilier avec audit exhaustif | 26 / 26 | `validation-1000-inspections-20261022.log.gz` |
| Registre et progression | 16 / 16 | `validation-suivi-20261022.log.gz` |
| Correction atelier/dépôt : deux suites natives | 10 / 10 | `validation-correction-defenses-20261022.json` |
| Correction atelier/dépôt : navigateur | 300 / 300 contrôles ; 3 / 3 profils complets | `validation-correction-defenses-20261022.json` |

Les 196 contrôles de campagne utilisent explicitement `?tools=1&fixture=legacy`. Ils ne qualifient pas le parcours complet de l’entrée joueur actuelle. Les contrôles mobiles sont des formats Chromium simulés, pas des essais sur appareils physiques.

La correction atelier/dépôt a été appliquée **après** la fin du contrôle global : ses résultats sont donc rattachés aux deux empreintes de fichiers contenues dans `validation-correction-defenses-20261022.json`. Qualification ciblée complète : **réussie**. Le jeu conserve ses règles de portée et de paiement ; la fixture choisit un accès réel à l’atelier depuis lequel le dépôt reste hors de portée. Les assertions du parcours navigateur sont conservées.

Une première exécution locale a été interrompue après des refus `EPERM` de sous-processus Node/IPC et de sockets localhost. La même commande a été relancée avec les permissions nécessaires, sans modifier les assertions. Ce diagnostic reste archivé comme passage interrompu dans `validation-diagnostic-isolation-20261022.log.gz` ; il ne remplace pas le résultat complet ci-dessus.

## Limite distincte : lancement natif Windows

Le [job Windows 119772489146](https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/39763290956/job/119772489146) construit le paquet, puis échoue sur `Native survey action did not advance`. Le portable Windows n’est donc pas qualifié par cette livraison.

La comparaison Chromium reproduit un défaut d’accessibilité identique sur main et sur les sources de la PR : dans le scénario story/rearguard, graine 17117, le solide natif `settlement-2-building-2` recouvre tout le disque de reconnaissance du secteur `market`. Le contrôle `friendlyPositionClear` refuse alors la progression. La fixture historique G8 passe ces mêmes étapes. Les inspections sont absentes du profil main.

Cette preuve démontre un défaut préexistant dans la reproduction locale et reste compatible avec le journal Windows. Elle ne prouve pas à elle seule toutes les gardes du processus Electron en CI : le paquet Windows n’a pas été rejoué. `diagnostic-survey-20261022.json` et son détail Markdown conservent les profils, substitutions HTTP, empreintes et limites. Aucun changement de graine, passage en legacy ou suppression d’assertion n’a été appliqué pour rendre artificiellement le smoke natif positif.

## Limite distincte : scénario navigateur de reconstruction

Le [job browser/campaign 119772489316](https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/39763290956/job/119772489316) échoue dans `scripts/browser-reconstruction144.mjs` : sa maison fixe en grille `(74, 70)` empiète sur la route native `depot-ring-east`, et le placement refuse « Chaussée ou voie financée à préserver ». La maison n’est pas créée ; les vérifications de reconstruction ne commencent pas.

Le diagnostic ciblé reproduit ce refus sur ordinateur et mobile simulé, pour main et pour les sources de la PR. Il conserve les mêmes conditions et la même fixture de placement. La comparaison, ses adaptations de disponibilité du navigateur et ses limites sont détaillées dans `diagnostic-reconstruction-20261022.json`. Cet échec préexistant ne doit pas être confondu avec les 196 contrôles réussis du parcours distinct `browser-campaign`.

La CI GitHub n’est donc pas déclarée entièrement réussie par cette livraison. Son état reste distinct du résultat local et des vérifications propres au Codex consignés ci-dessus.

Le [groupe navigateur siège](https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/39763290956/job/119772489893) signale également deux échecs sur `7ec448a`. Celui du retrait atelier/dépôt concerne la préparation d’une fixture et fait l’objet de la correction ciblée livrée avec ses preuves séparées. L’autre, dans `browser-sprites159.mjs`, attend une blessure du commandant par un contact visible ; sa cause n’est pas établie. Des fichiers identiques à main ne suffisent pas à attribuer ce dernier échec à la version antérieure. `validation-ci-etat-20261022.json` conserve les trois jobs opérationnels en échec et leurs assertions exactes, sans confondre un correctif local ultérieur avec une réussite du run original.

## Historique et travaux ouverts

Les preuves `validation-20261021.json`, `validation-main169-20261021.json` et leurs journaux conservent la passe antérieure de 5 616 tests et ses reprises ciblées. Leurs anciens échecs ne sont pas effacés ; ils ne décrivent pas la passe du 22 octobre. De même, `verification-classeur-final.json` documente le classeur antérieur, remplacé par le fichier et la vérification du 22 octobre.

3 000 variantes restent à concevoir. Pour les 1 000 inspections actuelles, l’implantation dans les seeds et les réseaux, les services, les réserves de volumes, le butin, les rencontres, l’art définitif et la persistance de campagne restent ouverts. La PR conserve son état de brouillon.
