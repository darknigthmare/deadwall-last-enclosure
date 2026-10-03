# Combat et préparations personnelles — 1.40

Le panneau Commandant conservait une autorisation antérieure à l’armurerie : ses quatre préparations pouvaient démarrer pendant le contrôle manuel d’un mirador. Le vidage de la cartouchière avait le même contournement. Le vrai bouton Outils du document livré restait disponible ; un travail terminé faisait passer la ferraille de 120 à 110 et les outils de 0 à 30 tout en gardant `mounted=41`.

`player-pack131.js` consulte maintenant `fieldcraft.context().mounted` dans l’aperçu commun aux quatre préparations et avant le retour de munitions au dépôt. L’état et la raison du bouton de cartouchière suivent ce refus. Le travail redevient disponible dès la libération du poste. Le tir manuel du mirador conserve ses règles.

Aucune statistique, recette, durée, masse, réserve, usure ni donnée de sauvegarde n’est modifiée. Les préparations gardent leur paiement après travail, le nettoyage ses usages par famille d’arme et la cartouchière ses munitions réelles. `arsenal134.js` et `hero-actions133.js` ne reçoivent aucun changement.

## Preuves

`tests/combat140.test.cjs` charge les scripts dans l’ordre de `index.html`, prépare un mirador avec emprise et accès validés, puis utilise les boutons effectivement montés du panneau Commandant. Les cinq scénarios vérifient le refus sans dépense, la libération, le démarrage réel par le bouton, la pause, une seule dépense au terme et la conservation après sauvegarde. La cartouchière ne rend son reliquat qu’une fois.

- `combat140-before.tap` : cinq échecs avant modification.
- `combat140-baseline139.tap` : les mêmes cinq échecs contre la copie intacte 1.39.
- `combat140-final.tap` : les cinq scénarios corrigés passent.
- `combat140-probe.json` : observation initiale du vrai bouton Outils et de ses effets.
- `combat140-targeted.tap` : les 60 scénarios ciblés des préparations, de l’armurerie, de la recharge, de l’usure et de la mêlée passent.

La lecture des chemins de combat conserve les propriétaires des cibles : zombies locaux, contacts régionaux, groupes sauvages et dépouilles réanimées. La mêlée de l’arsenal filtre portée, direction, étage, intérieur et ligne physique avant d’appliquer ses dégâts. Les résidents régionaux sont chargés à l’étage courant et les escaliers vident leurs contacts et projectiles transitoires. Les scénarios historiques couvrent notamment le multicible et les cartouches à deux unités entre D-17 et la région. Aucun autre défaut concret de combat n’a été reproduit dans ce périmètre.

Limites : DOM simulé avec simulation réelle et scènes préparées. Les étapes chronométrées isolent le travail personnel de la récolte des ouvriers. Ces vérifications ne certifient pas le CSS réel, le tactile physique, l’audio, les performances GPU ni un équilibrage humain de campagne longue. La vérification globale appartient à la passe de livraison.
