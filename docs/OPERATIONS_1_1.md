# DEADWALL 1.1 — Sorties de ravitaillement

Candidat local 1.1.0-candidate.1. Base : c1db812e2ddf81b3f9a9926362a7ba13b32dbb65.
L’extension n’a pas été publiée. Les sources, tests et préparateurs sont livrés ; le dépôt intégral et ses atlas ne sont pas inclus dans ce pack.

## Boucle jouable ajoutée

Le poste de commandement > TERRAIN > SORTIES contient douze contrats, deux dans chacun des six secteurs existants. Les premières sorties sont disponibles au Refuge, les autres demandent des vagues, paliers, livraisons et bâtiments achevés. Une seule sortie à la fois. Le matériel de préparation est débité lorsque le commandant est présent près du centre par un accès ouvert.

Le joueur doit rejoindre le site, maintenir ACTION / E dans une zone accessible et sans infecté vivant dans un rayon de 150 unités autour du site ou du joueur. La préparation dure de 12 à 28 secondes actives. Des positions d’approche autour du centre du site permettent d’accéder au marqueur lorsque des constructions occupent son centre ; elles ne permettent pas de travailler à travers un mur.

Le lot de 16 à 30 unités occupe une part réelle du sac de 36 unités. Le joueur ne peut pas le prendre si ses ressources ordinaires ne laissent pas cette place. La mission réduit temporairement la capacité disponible pour la récolte ordinaire. Le chargement compte une fois dans la collecte, la remise une fois dans le compteur des dépôts.

La fenêtre totale de retour est de 210 à 320 secondes de simulation. Elle commence au départ, pas au chargement. Les menus et la pause la suspendent. Le délai ne s’écoule pas pendant la fermeture de l’application. Le commandant doit revenir au centre de commandement ; un entrepôt ne peut pas valider la sortie. Les dépôts ordinaires dans les entrepôts conservent leur comportement historique.

Le retour est une transaction indivisible : toute la cargaison doit tenir dans le stockage. Sinon elle reste portée, aucun objet ni point n’est crédité, et le délai continue. Les plans et points d’analyse sont attribués une seule fois, lors du retour. Le moral est plafonné à 100. Une chute du commandant, le dépassement du délai ou un abandon confirmé font perdre le lot et le coût de préparation. Le contrat peut être retenté en payant à nouveau. Une livraison réussie n’est pas répétable.

## Contenu

- Maisons : La remise des maisons ; Les noms sur les boîtes.
- Arcades : Le rideau de fer ; Le four communal.
- Camp des veilleurs : Les armoires scellées ; Le protocole de stérilisation.
- Cour des citernes : Les fûts consignés ; Le banc de récupération.
- Terminus : Le manifeste du terminus ; La réserve du dernier autobus.
- Barrage : Les caisses de la relève ; Les optiques du barrage.

Ce sont douze objectifs de récupération partageant la même boucle, pas douze nouvelles cartes ni douze mécaniques de mission distinctes. Les briefings sont originaux et ne remplacent pas le registre narratif D-17 existant. Aucun PNJ n’est téléporté ou inventé comme récompense.

## Quatre plans liés aux industries existantes

| Plan | Production nominale/min | Intrants/min | Électricité | Dépendance |
|---|---:|---|---:|---|
| Cuisine collective | 34,8 nourriture | 1,5 carburant | 2 | Ferme |
| Atelier de pansements | 2,7 médicaments | 4,8 nourriture ; 1,5 ferraille | 3 | Clinique |
| Banc de récupération | 33,6 ferraille | 2,4 carburant | 3 | Atelier militaire |
| Projecteur de périmètre | Éclairage nocturne, rayon 230 | Aucun carburant direct | 1 | Générateur |

Chaque bâtiment est aussi soumis à son coût de chantier, son temps de construction, son palier, sa place au sol, sa santé et sa signature. Les définitions sont centralisées dans le module ajouté à core.js. Les industries utilisent la production générique, le partage électrique, les intrants et plafonds du moteur d’origine. Le projecteur utilise la passe d’éclairage de nuit et la priorité des défenses ; il ne tire pas et ne révèle pas un brouillard de guerre. Les nouvelles silhouettes sont des dessins Canvas procéduraux séparés, pas des atlas générés.

## Logistique et interface

Un onglet LOGISTIQUE donne les stocks, productions, consommations et soldes instantanés convertis par minute. Il inclut la nourriture du personnel, le carburant des générateurs, les industries, l’allocation électrique et le délestage de la crise Noir électrique. Ce n’est pas une projection fiable à une minute : les ressources peuvent saturer, plusieurs industries partagent leurs intrants, et les dépenses de tir, construction, réparation, récolte et recrutement ne sont pas prédites.

Le HUD ajoute le contrat actif, la phase, la distance et le délai. Le terrain affiche un cercle et une flèche de direction. Les briefings repliables, raisons de verrouillage et confirmations restent accessibles au clavier ; l’onglet fonctionne également sur le banc tactile à 390 × 844. Les autres onglets restent accessibles.

## Sauvegarde et migration

La sauvegarde passe à la **version 3**, dans `deadwall-save-v3`, avec secours `deadwall-save-backup-v3`. Les anciennes clés v2, secours v2 et v1 restent lisibles et ne sont pas effacées. La migration d’une campagne v1/v2 crée un registre de sorties vide, sans gain. Le normaliseur de recherche d’origine est conservé, y compris pour les fichiers v3. Les nouvelles constructions et les sorties ne peuvent pas être relues par l’ancien jeu : exporter une copie v2 avant mise à jour est recommandé.

`fieldOps` contient la version interne, les contrats livrés, les compteurs d’échec bornés, la sortie active (phase, travail, délai) et le dernier bilan. Les cargaisons ne sont jamais reprises depuis des quantités libres d’un fichier : elles sont déduites du contrat. Les doublons, prérequis impossibles, identifiants inconnus et nombres non finis sont refusés avant mutation du monde. Le statut de pause et les confirmations d’abandon ne sont pas sauvegardés. Aucune récompense n’est attribuée à la lecture ou au rafraîchissement de l’interface.

## Intégration technique

Le préparateur ajoute le catalogue/logique à `src/core.js`, l’adaptateur au validateur existant `src/save.js`, et les raccordements à la fin de `src/game.js`. Les scripts publics et la liste des ressources restent donc les mêmes. Le code UI attend DOMContentLoaded : le module historique content-ui.js vide et reconstruit d’abord son panneau. Le cache PWA est révisé ; les versions package.json et package-lock.json restent cohérentes. Aucune dépendance n’est ajoutée ni mise à jour.

Les correctifs 1.0.1 précédents sont appliqués cumulativement, ou reconnus par leur reçu et leurs copies originales. Chaque source doit correspondre au blob Git vérifié. Le préparateur refuse toute divergence, les chemins hors projet et les liens symboliques, y compris pendants. Il ne pousse rien sur GitHub et ne déploie pas sur Vercel. L’installation conserve les octets originaux ; le retrait refuse les fichiers modifiés depuis.

## Périmètre de preuve

Les tests de logique exécutent le module réel. Les tests d’installation utilisent des sources synthétiques explicitement identifiées. Les quatre profils Chromium sont quatre contextes automatisés parallèles du module réel sur un moteur hôte simulé, non quatre personnes ayant joué une campagne complète. Le banc déplace parfois les acteurs et avance le temps par programme pour isoler des cas précis. Les captures portent un bandeau qui le précise.

Le jeu complet avec ses textures, sa navigation réelle, ses hordes, ses scénarios et son budget de rendu n’a pas été exécuté dans cet environnement. `npm run check` de la copie GitHub complète, l’équilibrage à long terme, la migration de vraies campagnes, les chevauchements du HUD d’origine, l’application Windows Electron et le cycle de mise à jour PWA restent à valider avant fusion. Le lanceur de préparation s’arrête si un contrôle du dépôt échoue et ne présente pas ce cas comme un succès.
