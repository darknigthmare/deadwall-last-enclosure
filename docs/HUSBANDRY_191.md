# 191 — Enclos régionaux, entretien et transformation

Cette passe complète le correctif local chasse/pêche 190 et part du contenu de `main` au commit `667de8bcf8a9d6252483aa82f6f13ce42f136458` (PR 8 déjà fusionnée). Les nombres 190 et 191 sont des repères techniques, pas des numéros de version commerciale.

## Commandes et boucle réellement implémentées

En région naturelle (`balanced`, `large`, `patchwork`), à pied au sol : **Opérations → Expéditions → Enclos & transformation**. La page utilise le panneau de commandement existant, sans nouvelle superposition.

L’enclos est posé **au nord du commandant**, sur une emprise sèche de 3 × 3 mètres ; son accès reste au sud. Construction : 10 bois + 6 ferraille pris dans le sac, 8 secondes sur place. Routes, refuge, emprises occupées et accès obstrués sont refusés. Le volume de l’enclos bloque piétons, animaux, véhicules et déplacements des contacts régionaux. Les clôtures n’inventent pas un écran opaque aux projectiles.

La capture au filet concerne le lapin, le canard, le lièvre, le faisan et la perdrix. Elle exige un animal généré vivant, visible à 2,2 mètres au maximum, et un enclos de la même espèce à proximité. Une capture dure 6 secondes et engage 1 ferraille + 1 nourriture du sac. Le sujet est immobilisé pendant la tentative et transféré à la représentation du petit enclos au terme du geste. Ce transfert local abstrait n’est pas une escorte animalière ou une cage portative. Les animaux blessés gardent leur santé proportionnelle.

Une origine sauvage ne peut être à la fois un animal libre, un captif et une carcasse récoltable. Le registre des enclos possède la garde de ses sujets ; la suppression de l’affichage sauvage ne détruit pas leur historique. Les animaux d’origine libérés reprennent depuis leur position sauvage conservée, avec la santé réduite de la captivité ; pas de soin gratuit. Les jeunes nés en enclos ne sont pas encore réintroduits comme des descripteurs sauvages.

## Entretien, naissances et pertes

8 enclos, 4 animaux vivants de la même espèce par enclos, 64 enregistrements de garde/descendance au maximum. Les rations sont prises dans le sac. L’eau est puisée pendant 6 secondes uniquement quand de l’eau douce réelle, sans pont ni obstacle solide, se trouve à portée de l’accès sud ; aucun transfert à distance depuis une rivière. La consommation individuelle est centralisée dans `Husbandry191Rules`.

La simulation de captivité avance avec le jeu, également quand le joueur est revenu à D-17 ; jamais pendant une pause, une modale ou un chargement. Les intervalles excessifs sont bornés, pas convertis en heures de rattrapage hors ligne. Sans entretien, la santé diminue ; un animal mort de négligence ne produit ni viande ni peaux. La gestion d’une région éloignée reste une abstraction, pas une simulation de transport d’eau par les PNJ.

Les lapins et canards adultes de sexes différents, en bon état et disposant de réserves, peuvent avoir un jeune après 900 secondes simulées. La naissance consomme des intrants supplémentaires ; l’entretien continue pendant l’attente. Les jeunes prennent 900 secondes pour devenir adultes et ne sont pas transformables avant. Les autres espèces capturables ne sont pas annoncées comme reproductibles. Aucun animal n’est créé au simple chargement ou à la consultation du dossier.

Des infectés réellement au contact peuvent détériorer un enclos. Une clôture détruite libère ses animaux d’origine si leur position sauvage conservée est libre ; ses descendants sont enregistrés comme dispersés hors de la simulation détaillée, pas comme un nouveau troupeau sauvage. Une origine devenue obstruée garde son sujet sous votre responsabilité dans la ruine, avec entretien, âge et santé actifs. Dégagez cette origine pour le libérer, ou reconstruisez sur place en payant les matériaux ; l’historique et les produits ne sont pas réinitialisés. Le routage des hordes vers des élevages distants reste distinct.

## Viande, peaux, cuir et cuisine sur place

La transformation d’un captif adulte nécessite le couteau ou la machette réellement équipé. Elle dure 9 secondes, use l’outil et verse viande/peaux dans le stock de l’enclos, jamais dans le dépôt distant. L’origine est retirée du registre vivant au même moment ; l’ancienne récolte 190 refuse cette origine pour éviter les doublons.

Cuisson : jusqu’à 4 unités de viande, 8 secondes et 0,5 carburant transporté. Les provisions arrivent dans le sac dans la limite de sa place restante. Tannage : une peau brute + 2 unités d’eau du site + 0,5 carburant, 12 secondes, pour un cuir stocké sur place. Deux cuirs permettent un renforcement de clôture de 25 points, sans dépasser son intégrité maximale. Ce n’est pas encore une garde-robe en cuir ni une filière de vente.

La viande brute se dégrade en 900 secondes et les peaux en 1 800 secondes. Le lot existant impose une échéance commune conservatrice : rajouter une carcasse ne renouvelle pas les anciennes portions. La cuisson et le tannage interrompus ne remboursent pas le combustible. La reprise ne relance pas gratuitement une opération payée. Les ressources brutes restent dans l’enclos : leur transport en coffre ou en sac spécifique est encore à réaliser. Le dépeçage sauvage 190 conserve sa conversion historique en provisions ; cette nouvelle chaîne brute concerne les animaux captifs.

## Comportements et présentation

L’activation des **comportements naturels** est volontaire dans le dossier. Elle permet la prédation locale du renard et de la chouette sur certaines petites proies réellement actives, avec ligne libre, contact, dégâts et délais entre attaques. Les blessures et morts passent par le registre sauvage existant. Un sanglier blessé et alarmé peut riposter au contact via l’entrée de dégâts habituelle du commandant. Les limites de déplacement historiques, les obstacles et les budgets de population restent appliqués.

Cette passe n’implémente **pas les migrations longues**, la prédation à travers des régions déchargées, une consommation complète des carcasses par la faune, ou un pathfinding aérien au-dessus des toitures. L’activation ne change pas la graine, les routes, les plans ou les profils climatiques.

Les appels d’animaux sont des **signatures sonores synthétiques stylisées** fondées sur l’espèce, diffusées par l’audio existant : volume général, silence, budget de voix, heure d’activité, distance et occlusion sont respectés. Il ne s’agit pas d’enregistrements zoologiques fidèles ; les poissons ne vocalisent pas. Les clôtures, mangeoires, abreuvoirs, stocks et petits/nés captifs utilisent le rendu procédural. Une surcouche attachée aux épaules anime les avant-bras et l’outil lors de la préparation, de la capture, de la cuisine et du tannage. Elle respecte la réduction des animations ; ce n’est pas un remplacement complet du rig corporel ni des vêtements.

## Validation et limites de livraison

Les tests distinguent le DOM/moteur simulé, les petits bancs de contrat et le navigateur réel. Les scènes avancées stockées et les coordonnées de test sont déclarées, pas présentées comme une campagne humaine. Les résultats des tentatives sont conservés ; seuls ceux de la révision finale valent qualification. Aucun test historique n’est supprimé pour masquer une régression.

Les intérieurs libres, la vie civile exhaustive, l’élevage automatisé par PNJ et le multijoueur partagé restent distincts. Le patch doit rester en brouillon tant que les parcours navigateur, la CI exhaustive avec endurance et Windows ne sont pas qualifiés sur son SHA actuel.

## Parcours navigateur livré

`browser-husbandry191.mjs` utilise deux formats (ordinateur et portrait tactile), le menu natif puis une position régionale et un sac explicitement préparés. Le lapin provient du générateur réel. Les boutons d’action sont activés par clic/toucher, puis le temps du contrôleur de production est avancé explicitement avec la boucle RAF arrêtée. Sauvegarde, menu, rechargement et Continuer reprennent les contrôles natifs. Cela isole les transactions et la représentation ; il ne s’agit pas d’une campagne naturellement jouée ou d’une validation des temps de travail réels. Le résultat demeure non qualifié tant que le workflow sur le commit exact n’a pas terminé.
