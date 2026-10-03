# Livraison 1.35 — Terres vivantes

La 1.35 reprend l’intégralité des systèmes de la 1.34. La nouvelle génération régionale est appliquée uniquement aux nouvelles campagnes. Une sauvegarde G1–G5 garde ses lieux, stocks, points de retour, graines et identifiants.

## Ce qui change en partie

- **HUD** : le contexte actif et les mini-jeux disposent d’une zone commune ; les outils secondaires sont regroupés ; les modales possèdent la priorité.
- **Géographie** : 24,576 km de côté, D-17 variable selon la graine, 34 agglomérations irrégulières, un réseau connecté et des accès physiques.
- **Biomes** : douze milieux tempérés cohérents, neuf essences d’arbres, quatre familles minérales et huit petits décors. Les ressources et les collisions partagent les mêmes objets.
- **Rencontres** : six profils régionaux repris des familles d’infectés existantes, avec composition par biome, santé, vitesse et cadence de contact déterminées. Aucune nouvelle faction artificielle.
- **Lieux** : les 62 gabarits existants sont répartis selon les milieux. Les serrures, groupes, tableaux, lampes, barricades et réserves conservent leurs fonctions réelles.
- **Codex** : 106 fiches supplémentaires dérivées de ces définitions. Le compagnon de 3 000 fiches et ses originaux sont conservés.
- **Graines** : un champ vide reste aléatoire à chaque nouvelle campagne ; une graine saisie reste volontairement reproductible ; l’aperçu n’est consommé qu’au prochain départ.

## Contrôles et limites

Les rapports de tests et captures se trouvent dans `reports/1.35.0/`. Les captures emploient les peintres du jeu et Canvas natif avec un DOM simulé ; les scènes de démonstration sont signalées. Les mesures CPU ne constituent pas une certification de fluidité GPU. L’interface CSS interactive dans un navigateur reste à vérifier.

La région est étendue mais bornée. Le climat/altitude écologique du générateur ne constitue pas un terrain 3D ni des cours d’eau physiques. Les essences fruitières ne créent aucune récolte renouvelable. Les armes posables de la 1.34 restent limitées à D-17.

Les modules de migration et les anciennes générations sont volontairement conservés. Les anciens systèmes ne sont pas désactivés arbitrairement pour obtenir la nouvelle carte. Aucun push ou déploiement distant n’est annoncé.
