# ACTION et rechargement — 1.39

## Défaut reproduit

Pendant une vraie recharge du pistolet, maintenir E continuait à récolter un nœud, vider le sac au dépôt, travailler sur un chantier ou avancer le relevé d’une sortie locale. Les quatre cas échouent avant correction. Le premier a aussi été rejoué sur les sources autoritatives 1.38, sans les autres corrections de cette passe.

## Correction

L’entrée commune de `Game.updatePlayer` attend que la recharge se termine avant d’appeler les propriétaires de `updateInteraction`. Cette position est nécessaire : plusieurs modules historiques encore utilisés interceptent E avant le gestionnaire de base. Celui-ci refuse également la recharge lorsqu’il est appelé directement. Les déplacements, le décompte de recharge et la simulation de la colonie restent actifs.

Les propriétaires de stocks restent inchangés. Aucun matériau n’est prélevé et aucun travail manuel n’avance pendant le refus. À la fin de la recharge, l’interaction ordinaire reprend au même endroit, selon sa portée et son accès existants.

## Vérification

`scripts/qa139-interaction.cjs` charge l’ordre HTML livré sous DOM simulé, utilise `startReload`, maintient E sur le pas joueur réel et termine la recharge sans maintenir E avant de reprendre l’action. Quatre scénarios vérifient les quantités ou progressions avant et après, puis une véritable sauvegarde/reprise. Le pas joueur isolé évite de confondre les travaux des ouvriers avec ceux du héros ; il ne remplace pas le contrôle intégré de la boucle complète.

Les constructions et positions lointaines sont des préparations de scène vérifiées par les emprises réelles. Le véhicule de la sortie est acheté avec le vrai contrôleur. Aucune exécution dans un navigateur réel n’est revendiquée.
