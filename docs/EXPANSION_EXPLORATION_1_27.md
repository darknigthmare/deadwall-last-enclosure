# Trajets & récupération — 1.27

Le module `src/exploration-pack.js` complète les sorties à pied dans **D-17**. Les relais régionaux, expéditions et modules techniques existants restent leurs propres systèmes. Aucun nouveau biome n'est annoncé.

| Ajout jouable | Interaction | Coût / limite | Conséquence |
|---|---|---|---|
| Relevé de gisement | Approcher une réserve réelle puis la relever dans Opérations → Trajets & récupération | 3 s immobile, 1 nourriture du sac ; 128 relevés | Le gisement rejoint le carnet et devient extractible en ballot ; quantité restante affichée |
| Cache de retour | Poser une caisse sur un sol libre puis y transférer le sac | 4 s, 6 bois + 3 ferraille du sac ; 8 caches × 54 ressources | Réserve locale finie, entièrement financée par le joueur ; reprise limitée au sac |
| Itinéraire balisé | Planter des piquets espacés | 1,5 s, 2 bois + 1 ferraille ; 24 piquets, espacement 96 unités | Piquets physiques, fil de trajet discret et tracé sur la minimap ; effacement au dépôt sans remboursement |
| Ballot de récupération | Arrimer les ressources d'un gisement relevé puis rentrer au dépôt | 6 s, jusqu'à 24 unités retirées de la réserve réelle ; un ballot porté | Allure à 72 %, sprint suspendu ; le sac conserve son propre contenu et sa capacité |
| Sortie compromise | Poser volontairement un ballot ou le retrouver après mise à terre | Reprise physique en 2 s, dos libre et infectés éloignés | Contenu conservé ; aucun transfert à distance ni récompense au chargement |

Les interventions s'interrompent sans prélèvement si le commandant bouge, subit un coup ou si un infecté approche. La pause n'avance pas les tâches. Les tâches de services essentiels, préparation nocturne et autres opérations ne peuvent pas se superposer.

Un ballot peut être livré partiellement si le dépôt est presque plein. Le reliquat reste porté ; les ressources ne disparaissent pas et ne dépassent pas le stockage. L'extraction met à jour la quantité du gisement natif et les statistiques de récolte. La livraison met à jour les stocks et le compteur de dépôt.

Les ballots locaux restent dans D-17 : entrer dans un véhicule ou rejoindre la région les laisse automatiquement à la dernière position locale. La région utilise déjà son coffre et ses modules techniques. Un commandant à terre laisse aussi le ballot derrière lui ; l'évacuation médicale n'en crée pas une copie.

Les caches, ballots et piquets partagent la file de profondeur du décor et des personnages. Ils sont de petits équipements passables, pas des barricades. Un trajet balisé décrit le parcours choisi par le joueur ; le fil dessiné ne garantit pas un chemin libre à travers un mur construit ultérieurement.

## Persistance et API

État additif `expansions127.modules.exploration`, version 1. Aucun stock initial n'est offert. Les tableaux ont des bornes, les IDs des gisements doivent appartenir à la sauvegarde et les types doivent correspondre à la carte canonique. Les cargaisons conservent type, quantité, origine, position et état porté/posé. Une sauvegarde invalide est refusée par le registre commun avant mutation du monde.

API `g.explorationPack` : `survey(nodeId)`, `placeCache()`, `cacheTransfer(cacheId, 'store'|'take')`, `markRoute()`, `extract(nodeId)`, `deliver()`, `drop()`, `recover(cargoId)`, `clearRoute()`, `preview(kind,id)`, `overview()`, `snapshot()`, `busy()`, `cancel()`.

Les chiffres de gameplay résident exclusivement dans `DeadwallCore.ExplorePackRules`. Le rendu ne modifie aucune ressource. Le relevé recherche les gisements à portée à l'ouverture du panneau ; la boucle de simulation ne parcourt ces réserves que pendant un travail actif.
