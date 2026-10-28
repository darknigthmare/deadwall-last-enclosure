# Récupérateurs de pluie des haltes G11

Les tonneaux de pluie des quatre familles résidentielles G11 existent déjà dans les plans et les détails physiques. Leur gabarit de 0,7 × 0,7 m, leurs identifiants et leurs obstacles restent conservés. Leur présence dessinée ne donne ni réserve initiale, ni eau potable, ni branchement électrique.

## Usages de terrain

Le collecteur aménagé commence vide. Il recueille ensuite de l’eau de pluie pendant le temps de simulation actif, dans la limite de sa capacité. Aucun remplissage antérieur à son aménagement n’est calculé au retour sur le site. Le seau partagé des incendies et de l’élevage reste le seul inventaire d’eau porté ; le niveau du tonneau est un stock de terrain distinct, débité ou crédité à la quantité réellement transférée.

| Travail | Temps actif | Fournitures et contrepartie |
| --- | ---: | --- |
| Aménager le récupérateur | 12 s | 4 bois et 4 ferrailles du sac ; crée une réserve vide |
| Puiser vers le seau | 4 s | Transfère seulement l’eau réellement disponible et la place libre du seau |
| Verser depuis le seau | 4 s | Retire l’eau du seau avant de créditer la place disponible du tonneau |

La réserve est limitée à 24 unités ; le seau conserve ses 8 unités historiques. Le débit de pluie est de 0,06 unité par seconde, multiplié par l’intensité réelle. Au maximum 64 collecteurs aménagés sont conservés. Les règles autoritaires résident dans `CampaignWater214Rules` de `src/core.js` ; ce tableau ne constitue pas un second catalogue de simulation.

Les travaux exigent une découverte sur place, une approche physique libre à pied au rez-de-chaussée, des mains disponibles et un support intact. Le résolveur choisit la première face réellement praticable parmi le sud, l’est, le nord et l’ouest. Le segment du geste peut ignorer le seul tonneau concerné, jamais les autres obstacles. Déplacement, dommage, combat, changement de campagne ou perte du support peuvent interrompre le travail. Pause et modale suspendent son avancement ; les tâches inachevées ne sont pas reprises au chargement.

L’eau recueillie est **non potable** : elle sert aux usages déjà portés par le seau, notamment les abreuvoirs et la lutte contre l’incendie. Elle ne soigne pas le commandant et ne crée aucune ressource dans le sac ou le dépôt de D-17. Le réseau d’eau potable, l’assainissement et les circuits électriques complets restent des chantiers séparés.

## Supports, réserves et transactions : preuves distinctes

Le producteur `scripts/audit-campaign-water214.cjs` inspecte les 200 modèles G11 et les trois graines déjà couvertes par le témoin géométrique publié : `0`, `17117` et `967313470`. Il rapproche tous les tonneaux physiques des descripteurs proposés, conserve les refus et vérifie leurs poses de travail avec les collisions réelles. Les modèles isolés ne sont pas comptés comme des sites apparus dans une graine.

Les empreintes des plans, détails, meubles, identifiants et stocks sont comparées au golden de la 1.72. Les témoins de monde rapprochent aussi les sites, routes et implantations. L’audit ne modifie aucun plan et ne déclare aucune transaction : un support accessible ne prouve ni son aménagement, ni une collecte de pluie, ni le transfert d’un seau ou un parcours d’interface.

```sh
node scripts/audit-campaign-water214.cjs --output /chemin/neuf/campagne214-eau.json
```

La sortie doit être neuve ; un résultat négatif reste conservé. Le rapport final sera produit après stabilisation des sources publiques, avec captures avant/après de leur inventaire. Les résultats natifs du propriétaire, les présentations visuelles et les parcours ordinateur/tactile doivent rester des réceptions distinctes. Ce document décrit le contrat du lot ; il ne préjuge pas de leur réussite.

## Avancement du Codex

Les quatre lignes de services T045–T048 sont déjà « En cours ». Une preuve valide de récupérateurs peut enrichir leur note avec le nombre réel de supports et de poses contrôlés. Elle ne valide pas globalement les 50 variantes de chaque famille, les 800 tâches, les caravanes encore fermées ou les autres familles du monde. Les modèles dépourvus de tonneau et les éventuels refus demeurent explicites dans le rapport.

Le lecteur `scripts/codex-campaign-water-progress214.cjs` accepte uniquement le rapport `campagne214-eau.json` dont les sources avant/après correspondent encore aux fichiers actuels. Il recalcule les totaux des quatre familles et des trois mondes, exige les 200 identités et leurs empreintes historiques, des supports non vides et aucun refus ni transaction. Sans rapport, les données restent identiques ; un rapport présent invalide interrompt la génération. Une preuve acceptée enrichit seulement les quatre notes existantes : statut, propriétaire, preuve208 et nombre de variantes jouables restent conservés.

Le zéro transaction du rapport de supports208 reste correct : ce rapport géométrique conserve son périmètre historique. De même, les 111 contrôles des services1.73 concernent leur scène T047-V09 et ne sont pas attribués à cette nouvelle collecte d’eau. Ni une campagne humaine complète de six à dix heures, ni la fluidité d’un téléphone physique ne sont déduites de ces inspections.
