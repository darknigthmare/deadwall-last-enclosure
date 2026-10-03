# DEADWALL 1.43 — Repli & préparatifs

Cette version poursuit la 1.42 avec des ordres de repli physiques, des informations de siège accessibles depuis le terrain et des récompenses d'objectifs préservées quand le dépôt est plein. Elle conserve la boucle récolte → dépôt → construction → automatisation → fortification → horde → reconstruction, les générations G1–G7 et le format général de sauvegarde v20.

## Replier une section

Les boutons REPLI de Territoires donnent désormais un ordre de déplacement vers la redoute sélectionnée, ou vers le centre de commandement. Les soldats empruntent les accès physiques, cessent leur poursuite et gardent leur riposte avec ses coûts ordinaires. Les cartes de sections et leurs repères sur le terrain indiquent la destination, redoute ou centre, ainsi qu'un trajet bloqué.

Une destination ne garantit pas un accès libre. Murs et portes conservent leurs collisions ; aucun ordre n'ouvre ou ne ferme automatiquement les portes. Si la redoute est détruite ou démontée, la section se replie vers le centre sans téléportation ni remboursement. Un nouveau ralliement efface la cible de repli précédente.

Le champ optionnel `retreatBuildingId` complète les groupes de `squads.version=1`. Les anciennes sauvegardes sans ce champ continuent de se replier vers le centre. Un identifiant malformé, un bâtiment d'un autre type, une redoute inachevée ou un ordre incohérent est refusé à l'import. Une redoute correctement référencée mais disparue se normalise vers le centre pour permettre la reprise après sa perte.

## Lire et préparer le siège

L'annonce des fronts apparaît dans la carte de vague pendant l'alerte, l'assaut et la sécurisation. L'alerte du centre est visible depuis le HUD sans ouvrir Situation. Ces indications reprennent les contacts et annonces de la simulation ; elles ne promettent pas une enceinte invulnérable ou un itinéraire sûr.

Pendant l'alerte et l'assaut, les accès PRÉPARATIFS, PORTES et SECTIONS ouvrent les contrôleurs existants. La préparation résume l'annonce et l'alerte actuelles, puis donne accès aux enceintes et aux sections. Son ouverture place le focus et le défilement sur le briefing, avec une composition compacte en paysage. Le commandement conserve sa pause et sa restitution de focus ; aucun second modèle tactique ou nouvel objectif n'est créé. Les fenêtres de paramètres, l'introduction et les autres modales gardent leur priorité.

## Récompenses réservées

Lorsqu'un critère d'objectif est rempli, il reste acquis même si une structure nécessaire est ensuite perdue. Si une seule composante de sa récompense ne tient pas dans le stockage, l'objectif attend : aucun versement partiel, dépassement de capacité ou passage au suivant. Le HUD annonce la récompense réservée et la place manquante par ressource. Dépenser les stocks ou terminer du stockage libère la place nécessaire ; le versement entier a lieu une seule fois, puis l'objectif suivant devient actif.

Le booléen optionnel `objectiveReady` conserve cette attente dans la sauvegarde v20. Son absence dans une ancienne sauvegarde vaut faux ; les objectifs déjà terminés ne reçoivent aucun cadeau rétroactif. Un champ malformé ou incohérent est refusé avant mutation du monde. Les montants des objectifs et leurs critères historiques restent inchangés.

## Jouer et mettre à jour

| Support | Démarrage |
| --- | --- |
| Navigateur/PWA | Extraire l'archive web puis servir intégralement `web/` sur HTTPS. Une première visite connectée remplit le cache hors ligne. |
| Mobile | Même PWA et commandes tactiles ; ajout à l'écran d'accueil depuis le navigateur. Aucun APK ou paquet App Store n'est fabriqué. |
| HTML autonome | Extraire l'archive puis ouvrir `DEADWALL_Standalone.html`. Images, styles et scripts sont embarqués. |
| Windows 10/11 x64 | Fabriquer avec `npm run package:desktop` sur Windows, puis vérifier le ZIP extrait avec `npm run test:desktop -- --archive <zip>`. |

Les sauvegardes du navigateur dépendent de son profil et de l'origine du site. Exporter une campagne avant de changer de navigateur, d'adresse ou de chemin. Le portable Windows utilise son profil séparé dans `%APPDATA%\DEADWALL` ; préserver ce dossier lors d'une mise à jour. Les archives originales 1.41 et les livrables 1.42 restent conservés séparément.

## Vérification et fabrication

Depuis les sources de développement, avec Node.js 22.12 minimum (24 conseillé) :

```sh
npm ci
DEADWALL_SOAK=1 npm run check
npx playwright install chromium
npm run test:browser
npm run test:campaign
npm run test:tactics
npm run test:standalone
npm run package:web
npm run package:source
```

`CHROMIUM_EXECUTABLE_PATH` sélectionne un Chromium déjà installé. Le parcours `test:campaign` utilise les commandes du joueur sur quatre formats ; ses rapports et captures sont enregistrés sous `artifacts/qa/campaign-*`. Le contrôle `test:tactics` prépare explicitement des scènes avancées après une nouvelle campagne : redoute achevée et fusilier Alpha, objectif logement acquis et nourriture au plafond. Il vérifie les branches tactiques et de stockage dans le vrai DOM ; ces fixtures ne constituent pas des campagnes jouées normalement. Ses preuves vont sous `artifacts/qa/tactics-*` ; `DEADWALL_QA_PROFILES=desktop,mobile` sélectionne ses profils. Les autres contrôles navigateur et PWA restent disponibles. Dans le cloud administré, `file://` est bloqué : `npm run test:standalone -- --transport http` vérifie les mêmes octets autonomes via un serveur local limité à ce HTML, et distingue ce résultat d'une ouverture directe depuis le disque.

Les commandes de fabrication exigent un dépôt Git contenant un commit pour consigner la provenance. L'archive source n'embarque pas `.git` ; démarrage, build et QA restent utilisables depuis les sources extraites. Chaque fabrication utilise un nouveau dossier `build-*`, avec liste exacte des fichiers et SHA-256 des fichiers extraits et de chaque ZIP. Les archives joueur embarquent le guide correspondant à leur version, les licences et la provenance des images. Les sources, tests, codex et fixture historique sont conservés dans l'archive de développement séparée.

## Contrôles navigateur exécutés

Le 2 octobre 2026, Chromium 151.0.7922.173 a passé les deux parcours 1.43 suivants, sans erreur JavaScript ou réseau enregistrée :

| Contrôle | Résultat | Portée |
| --- | --- | --- |
| `test:campaign` | 148/148, 37 par format | Quatre nouvelles campagnes G7, graine 17117 : 1440×900, 1280×720, tactile 390×844 et tactile 844×390. |
| `test:tactics` | 34/34, 17 par format | Scènes avancées avec fixtures explicites, en 1440×900 et tactile 390×844. |

Les campagnes passent par les commandes clavier ou tactiles du joueur : récolte personnelle, dépôt, placement payé, construction manuelle et par ouvriers, recrutement, commandes portes/sections, puis premier assaut atteint avec le vrai bouton de fin de journée. Aucun stock, acteur, emplacement ou temps de simulation n'est injecté. La reprise compare l'état sauvegardé de l'assaut hors horodatage renouvelé, avec le plan de vague et le RNG vérifiés ; la conversion normale de la file d'apparition en apparitions restantes est normalisée. Le budget restant de la horde conserve 19 unités avant et après reprise.

Le parcours avancé utilise les fixtures décrites plus haut pour vérifier le déplacement physique de repli, la riposte sans poursuite, la perte de redoute, la récompense en attente, son versement et les reprises. Il ne prétend pas avoir payé la construction ou le recrutement de ces fixtures. Sa comparaison de sauvegarde exclut uniquement l'horodatage renouvelé et le plan de vague reconstruit en phase calme ; les autres champs normalisés sont comparés. Les rapports JSON et captures sont conservés séparément des archives joueur. Ces parcours automatisés ne certifient ni téléphone physique, ni Windows natif, ni équilibrage d'une campagne longue.

## Suite complète sur les sources figées

Le 2 octobre 2026, `DEADWALL_SOAK=1 npm run check` a terminé avec **2410/2410 tests réussis**, aucun échec, annulation, test ignoré ou à faire, après contrôle de syntaxe de **198 fichiers** et fabrication des **209 fichiers publics**. La suite avec endurance a duré 20 min 33 s et la commande a quitté avec le code 0. Le journal complet et les rapports navigateur sont conservés séparément des archives joueur.

Ces chiffres portent sur les sources figées. Un parcours exécuté depuis les archives finales doit avoir son propre rapport ; les résultats ci-dessus ne le remplacent pas. La fabrication vérifie automatiquement les listes, tailles et empreintes des fichiers comprimés. Les preuves de la 1.42 restent historiques et ne certifient pas cette version.

## Étapes commerciales restantes

Le paquet Windows doit être essayé sur Windows ; les commandes tactiles doivent être évaluées sur des téléphones physiques. Sessions humaines longues, lisibilité, audio, équilibrage et performances demandent les appareils cibles. Signature éditeur, conditions accordées aux joueurs, assistance, classification et fiche boutique restent à finaliser avant mise en vente. La note de distribution se trouve dans `docs/THIRD_PARTY_NOTICES.md` avec les sources, et dans `NOTICES_TIERS.md` avec les archives joueur ; la licence source propriétaire reste applicable.

Aucun déploiement, publication en boutique, signature Windows ou certification matérielle n'est annoncé par cette livraison.
