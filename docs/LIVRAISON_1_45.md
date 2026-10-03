# DEADWALL 1.45 — Commandement & terrain

Cette version poursuit les sources cumulatives 1.44 en raccordant la progression de D-17, les accès physiques et les commandes de terrain à leurs contrôleurs existants. Elle conserve la boucle récolte → dépôt → construction → automatisation → fortification → horde → reconstruction, les générations G1–G7 et le format général v20. La référence 1.44 de 3929 fichiers et les archives historiques restent séparées et préservées.

## Préparer le prochain âge de D-17

Le panneau de progression distingue le score des structures actuellement construites, le pic atteint et le seuil du prochain âge. Le pic conserve les connaissances déjà acquises ; le reste à construire se calcule depuis le score présent. Perdre une structure ne transforme donc pas le pic historique en bâtiment encore disponible.

Les chantiers financés mais inachevés présentent leur potentiel entier à l'achèvement, y compris lorsqu'ils sont suspendus ou bloqués. Ce potentiel reste conditionnel : les chantiers doivent être terminés et rester debout, avec ouvriers, trajets et accès réels. Il ne prédit pas une production garantie et ne donne aucune capacité anticipée.

Les modèles de l'âge atteint et du prochain âge exposent les coûts du catalogue, ce qui manque au dépôt et leurs prérequis achevés. Les modèles encore verrouillés le restent ; terrain et emplacement passent toujours par la validation ordinaire. Gérer les chantiers ouvre le dossier existant et donne le focus à ses commandes. Cette consultation n'engage aucun ordre automatique, dépense ou nouveau champ de sauvegarde.

## Atteindre physiquement le repli

Une section ne considère plus une redoute ou le centre comme rejoint sur la seule portée. Elle doit disposer de son accès physique : une épave devant la structure impose un détour ; une route introuvable garde le diagnostic de trajet bloqué. Une porte verrouillée conserve ses collisions et peut arrêter le repli jusqu'à ce qu'un passage soit réellement disponible.

Le chargement conserve la position et la destination, puis recalcule le trajet sans déplacement instantané ni gain de stocks. Vitesse, riposte et coûts de combat restent ceux des contrôleurs existants. Le repli suspend toujours la poursuite et une redoute perdue conserve son retour vers le centre.

Les Traqueurs locaux abandonnent immédiatement une proie qui a quitté D-17 pour la région. Ils reprennent leur comportement local sans ajouter de scan dans ce tick. Un ouvrier encore présent dans D-17 reste une cible réelle : quitter le domaine ne protège pas les survivants qui y sont restés.

## Préparer la survie face aux vrais contacts

Les préparations de Survie prennent en compte les contacts physiques régionaux des sites, groupes et successions. Une dépouille réanimée à proximité bloque l'action lorsqu'elle partage l'étage, le lieu et une ligne physique accessible. Une vraie cloison ou un autre étage conserve sa séparation ; neutraliser la menace redonne accès à la préparation.

Si la menace apparaît pendant la pose, celle-ci est annulée avant son paiement de fin. Le rayon existant de 10 mètres, les coûts et les durées sont conservés. Un groupe historique encore vide avant son chargement régional peut permettre le démarrage ; dès que son contact apparaît au premier tick, la garde interrompt la préparation sans débit. Aucun nouveau besoin, stock ou champ de sauvegarde n'est ajouté.

## Comprendre la disponibilité de Sac & Relais

Les boutons de dépôt et de retrait lisent le même aperçu que la transaction réelle. L'interface affiche la raison du refus, y compris dans l'aide du bouton et sa description accessible : intervention, rechargement, poste de tir, décès, pause, éloignement, source vide ou destination pleine. La disponibilité revient quand l'état matériel le permet. Un ancien aperçu ne permet pas de contourner une intervention commencée ensuite.

Consulter les quantités et disponibilités ne dépense rien et ne modifie ni le message métier ni la préparation. Les montants acceptés restent bornés par les stocks et la capacité réels, y compris une place fractionnaire ; le reliquat reste dans son propriétaire. Les dépôts personnels continuent d'alimenter leur compteur exactement une fois et la reprise conserve ces quantités. Une quantité invalide ou une clé forgée est refusée avant mutation.

## Garder le terrain régional utilisable en paysage

Le dock compact de 44 pixels conserve les accès Carte, Sac, Matériel, SURVIE, Actions et Terrain. Les contrôles utilisent les fenêtres et actions existantes ; les ordres, modales et retours au jeu gardent leurs contrôleurs. Les zones libres mesurées atteignent 131 pixels de hauteur sur 844×390 et 101 pixels sur 780×360. Le format réduit garde donc une limite d'espace propre, à vérifier sur les appareils cibles.

`test:terrain` suit la graine 903145 sur desktop 1366×768, portrait tactile 390×844 et paysages tactiles 844×390 et 780×360. Il quitte D-17 physiquement, marche à l'extérieur, ouvre les vrais dossiers et vérifie les retours au terrain et la sauvegarde/reprise. Aucun stock, position, phase, temps ou acteur n'est injecté. Les rapports et captures précisent les dimensions réellement contrôlées.

## Jouer, vérifier et fabriquer

| Support | Démarrage |
| --- | --- |
| Navigateur/PWA | Extraire l'archive web et servir intégralement `web/` sur HTTPS ; première visite connectée pour remplir le cache hors ligne. |
| Mobile | Même PWA, commandes tactiles et ajout à l'écran d'accueil ; aucun APK ou paquet App Store n'est fabriqué. |
| HTML autonome | Extraire puis ouvrir `DEADWALL_Standalone.html`, avec scripts, styles et images embarqués. |
| Windows 10/11 x64 | Depuis les sources sur Windows : `npm run package:desktop`, puis `npm run test:desktop -- --archive <zip>`. |

Les sauvegardes dépendent du profil et de l'origine du navigateur. Exporter une campagne avant changement de site, de navigateur ou de chemin ; le portable Windows utilise son profil séparé `%APPDATA%\DEADWALL`.

Node.js 22.12 minimum, 24 conseillé. Les fabrications exigent un dépôt Git contenant un commit pour consigner la provenance ; l'archive source exclut `.git`. Démarrage, build et QA restent utilisables depuis les sources extraites.

```sh
npm ci
npm start
DEADWALL_SOAK=1 npm run check
npx playwright install chromium
npm run test:campaign
npm run test:terrain
npm run test:tactics
npm run test:browser
npm run test:standalone
npm run package:web
npm run package:source
```

`CHROMIUM_EXECUTABLE_PATH` sélectionne un Chromium déjà installé. Les anciens parcours `test:journey`, `test:assault` et `test:reconstruction` restent disponibles pour leurs régressions ; leurs résultats historiques ne certifient pas cette version.

Le cloud bloque `file://` : `npm run test:standalone -- --transport http` contrôle les octets autonomes via un serveur local, distinct d'une ouverture disque. Les archives joueur contiennent ce guide, les licences et la provenance des images. Chaque fabrication crée un nouveau dossier avec inventaire exact, empreintes par fichier et SHA-256 du ZIP ; les sources, tests, codex et fixture historique sont livrés dans l'archive de développement séparée. Le manifeste déclare le commit et l'état réel du checkout, y compris ses changements non committés.

## Preuves ciblées et rapport de validation

Le 2 octobre 2026, les sélections Node ciblées terminées comptent 8/8 cas de planification urbaine, 8/8 nouvelles régressions de repli et de Traqueurs, 46/46 cas de Survie et 34/34 de Sac & Relais. Ces sélections utilisent la simulation et, selon le cas, un DOM simulé avec fixtures documentées ; leurs comptes ne constituent pas le total de la suite complète.

| Parcours navigateur 1.45 terminé | Contrôles | Portée |
| --- | --- | --- |
| Campagne | 196/196, 49 par format | Quatre formats, commandes natives : récolte, dépôt, constructions payées/achevées, progression urbaine, premier assaut et reprise. |
| Tactique | 34/34, 17 par format | Desktop et portrait ; redoute/fusilier, objectif acquis et stockage plein préparés comme fixtures explicites. |

Ces deux parcours n'enregistrent aucune erreur de page, console, HTTP ou requête. Le parcours régional `test:terrain`, la suite complète avec endurance et les contrôles Web/PWA/autonome depuis les ZIP extraits ont leurs résultats datés dans un rapport distinct, après leurs exécutions réelles. Le compte final, les durées, le code de sortie et les empreintes des entrées figées y sont consignés. Tests Node, assertions navigateur et états examinés en revue restent des unités distinctes ; aucun compteur 1.44 n'est présenté comme preuve 1.45.

## Étapes commerciales restantes

Fabriquer et essayer le portable sur Windows, puis évaluer les commandes tactiles sur téléphones physiques. Sessions humaines longues, équilibrage, audio, accessibilité et performances exigent les appareils cibles. Signature éditeur, conditions accordées aux joueurs, assistance, classification et fiche boutique restent à finaliser avant mise en vente.

Les notices et la provenance restent applicables : `docs/THIRD_PARTY_NOTICES.md`, `LICENSE.md` et les fichiers de provenance des images. Aucun déploiement, publication en boutique, signature Windows ou certification matérielle n'est annoncé.
